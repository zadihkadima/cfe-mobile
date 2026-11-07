import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  formatDayLabel,
  isDifferentDay,
} from "@/core/format/formatMessageTime";

import { MessageBubble } from "./MessageBubble";

import { ConversationMessage } from "../api/conversation";

import { MessageAttachment } from "../api/types";

type Props = {
  messages: ConversationMessage[];

  currentUserId: string;

  workspaceId: string;

  onLoadMore: () => void;

  /** Whether older pages remain to be fetched. */
  canLoadMore?: boolean;

  loadingMore?: boolean;

  /**
   * Fetches the page below the window.
   *
   * Only reachable once the window has come away from the live end -- after a
   * jump into history, or after scrolling up far enough that the newest page
   * was trimmed to keep memory bounded.
   */
  onLoadNewer?: () => void;

  canLoadNewer?: boolean;

  loadingNewer?: boolean;

  /**
   * Rebuilds the window around a message that is not currently loaded.
   *
   * Resolves to false when the message cannot be placed, so the caller can
   * stop waiting for a jump that is never going to happen.
   */
  onAnchorTo?(messageId: string): Promise<boolean>;

  /** Whether the window still reaches the newest message. */
  atLatest?: boolean;

  onReturnToLatest?(): void;

  onReply?(messageId: string): void;

  onRetry?(message: ConversationMessage): void;

  onEdit?(message: ConversationMessage): void;

  onOpenAttachment?(attachment: MessageAttachment): void;
};

export function MessageList({
  messages,
  currentUserId,
  workspaceId,
  onLoadMore,
  canLoadMore = false,
  loadingMore = false,
  onLoadNewer,
  canLoadNewer = false,
  loadingNewer = false,
  onAnchorTo,
  atLatest = true,
  onReturnToLatest,
  onReply,
  onRetry,
  onEdit,
  onOpenAttachment,
}: Props) {
  const listRef = useRef<FlatList<ConversationMessage>>(null);

  /**
   * The message a reader has just jumped to, briefly.
   *
   * Scrolling alone is not enough: the list lands somewhere new with no
   * indication of which bubble was the point of the jump, and in a run of
   * similar-looking messages that is most of the question.
   */
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (highlightTimer.current) {
        clearTimeout(highlightTimer.current);
      }
    },
    [],
  );

  /**
   * Jump to the message a reply is quoting.
   *
   * The quoted block is a truncated excerpt, so it exists precisely to be
   * opened when the reader wants the whole of what was said.
   */
  const jumpTo = useCallback((index: number, messageId: string) => {
    listRef.current?.scrollToIndex({
      index,
      animated: true,
      // Put it a little in from the edge rather than flush against it, so the
      // messages around it are visible -- the reader is jumping back for
      // context, and a bubble pinned to the top of the screen has none.
      viewPosition: 0.5,
    });

    setHighlightedId(messageId);

    if (highlightTimer.current) {
      clearTimeout(highlightTimer.current);
    }

    highlightTimer.current = setTimeout(() => setHighlightedId(null), 1_600);
  }, []);

  /**
   * A parent that has been asked for but is not on a loaded page yet.
   *
   * Held in a ref rather than state because nothing renders differently while
   * the window is being rebuilt -- the pages arriving are their own progress
   * indicator -- and re-rendering the whole conversation for it would be
   * wasted work.
   */
  const wantedParentId = useRef<string | null>(null);

  const openParent = useCallback(
    (parentId: string) => {
      const index = messages.findIndex((m) => m.id === parentId);

      if (index >= 0) {
        jumpTo(index, parentId);
        return;
      }

      // The original is outside the loaded window. This used to walk backwards
      // a page at a time, up to ten pages, hoping to reach it -- which meant a
      // reply quoting something from two months ago either took twenty round
      // trips or silently did nothing. Anchoring asks the server for a window
      // around that one message instead, so the cost of the jump no longer
      // depends on how far back it goes.
      if (!onAnchorTo) {
        return;
      }

      wantedParentId.current = parentId;

      void onAnchorTo(parentId).then((placed) => {
        if (!placed) {
          wantedParentId.current = null;
        }
      });
    },
    [messages, onAnchorTo, jumpTo],
  );

  useEffect(() => {
    const wanted = wantedParentId.current;

    if (!wanted) {
      return;
    }

    const index = messages.findIndex((m) => m.id === wanted);

    if (index === -1) {
      return;
    }

    wantedParentId.current = null;

    // Deferred by a tick: the rebuilt window has only just been written to
    // `data`, so the list has not measured the new rows and would scroll
    // against stale offsets.
    const timer = setTimeout(() => jumpTo(index, wanted), 0);

    return () => clearTimeout(timer);
  }, [messages, jumpTo]);

  /**
   * Whether this message begins a new day, and so needs a date above it.
   *
   * The list is inverted, so the array runs newest to oldest and the message
   * *after* a given one in the array is the one that appears above it on
   * screen. A separator therefore belongs with the message whose predecessor in
   * time fell on a different day — and with the very last item, which is the
   * oldest thing loaded and always opens a day.
   *
   * Deriving it here rather than interleaving separator rows into the data
   * keeps `keyExtractor` operating on real message ids and avoids inventing
   * synthetic rows that the retry and edit paths would then have to filter out.
   */
  const startsNewDay = useCallback(
    (index: number) => {
      const current = messages[index];
      const older = messages[index + 1];

      if (!older) {
        return true;
      }

      return isDifferentDay(current.created_at, older.created_at);
    },
    [messages],
  );

  /**
   * Whether this message should carry its sender's name.
   *
   * A workspace conversation has several participants -- managers,
   * administrators and the client -- so a bubble alone does not say who is
   * speaking. The name is shown once at the top of each run rather than on
   * every message: consecutive messages from one person are visibly a run, and
   * repeating the name down the column says nothing the reader has not already
   * worked out.
   *
   * As with the day separator, the list is inverted, so the neighbour *after*
   * this one in the array is the message above it on screen. A run therefore
   * starts where the previous speaker differs -- and always after a date
   * separator, since a name sitting under a date reads as belonging to it.
   */
  const startsSenderRun = useCallback(
    (index: number) => {
      const current = messages[index];
      const older = messages[index + 1];

      if (!older) {
        return true;
      }

      if (isDifferentDay(current.created_at, older.created_at)) {
        return true;
      }

      return current.sender_id !== older.sender_id;
    },
    [messages],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ConversationMessage; index: number }) => (
      <View>
        {/* Rendered above the bubble in the element tree, which is below it in
            an inverted list — so it lands visually on top of the first message
            of the day, which is where a date separator belongs. */}
        {startsNewDay(index) ? (
          <View className="my-3 flex-row items-center px-4">
            <View className="h-px flex-1 bg-border dark:bg-dark-border" />

            <Text className="mx-3 text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary">
              {formatDayLabel(item.created_at)}
            </Text>

            <View className="h-px flex-1 bg-border dark:bg-dark-border" />
          </View>
        ) : null}

        <MessageBubble
          message={item}
          workspaceId={workspaceId}
          isOwn={item.sender_id === currentUserId}
          showSender={startsSenderRun(index)}
          highlighted={item.id === highlightedId}
          onReply={onReply}
          onOpenParent={openParent}
          onRetry={onRetry}
          onEdit={onEdit}
          onOpenAttachment={onOpenAttachment}
        />
      </View>
    ),
    [
      currentUserId,
      workspaceId,
      onReply,
      onRetry,
      onEdit,
      onOpenAttachment,
      startsNewDay,
      startsSenderRun,
      openParent,
      highlightedId,
    ],
  );

  const newestId = messages[0]?.id;

  useEffect(() => {
    // Index zero is the visual bottom of an inverted conversation. This runs
    // for both optimistic sends and incoming socket messages, keeping the new
    // bubble above the composer rather than leaving it obscured below it.
    //
    // Keyed on the newest message rather than the count, because the count
    // also changes when an older page is prepended -- which would drag the
    // reader back down to the bottom every time they scrolled up for history.
    if (!newestId) {
      return;
    }

    // Not while the window is anchored somewhere in the past. The bottom of an
    // anchored window is not the bottom of the conversation, and scrolling
    // there would throw the reader away from the message they just jumped to
    // -- including racing the jump itself, since anchoring changes the newest
    // loaded message as a side effect of rebuilding the window.
    if (!atLatest || wantedParentId.current) {
      return;
    }

    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [newestId, atLatest]);

  return (
    <View className="flex-1">
      <FlatList
        ref={listRef}
        className="flex-1"
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        // Bubbles are of wildly different heights, so the list cannot know the
        // offset of a message it has not rendered. Without this a jump to an
        // unmeasured parent throws instead of scrolling. Scrolling by an
        // estimate and retrying lands close enough that the second attempt has
        // real measurements to work from.
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });

          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.5,
            });
          }, 120);
        }}
        contentContainerStyle={{ paddingBottom: 12 }}
        onEndReached={() => {
          if (canLoadMore && !loadingMore) {
            onLoadMore();
          }
        }}
        // On an inverted list the "end" is the top of the screen, so this is what
        // loads older messages as the reader scrolls up. The threshold is a full
        // screen rather than a fifth of one: fetching a page takes a round trip,
        // and starting it only once the reader has almost run out of history
        // means they hit a blank gap and a spinner every time.
        onEndReachedThreshold={1}
        // And the "start" is the bottom, so this is what carries a reader who
        // jumped into history back down towards the present. It does nothing at
        // the live end, where there is no page below the window and new
        // messages arrive over the socket instead.
        onStartReached={() => {
          if (canLoadNewer && !loadingNewer) {
            onLoadNewer?.();
          }
        }}
        onStartReachedThreshold={1}
        // Without this, prepending a page of older messages shifts everything the
        // reader is looking at. They scroll up, the page lands, and the message
        // they were reading jumps away.
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 80,
        }}
        ListFooterComponent={
          loadingMore ? (
            <View className="p-5">
              <ActivityIndicator />
            </View>
          ) : null
        }
        // Rendered at the bottom of an inverted list, which is where the reader
        // is heading when this is spinning.
        ListHeaderComponent={
          loadingNewer ? (
            <View className="p-5">
              <ActivityIndicator />
            </View>
          ) : null
        }
      />

      {/* A reader who followed a reply into old history has no other way back:
          scrolling down page by page could be months of them. Only shown when
          the window is genuinely detached, so it does not sit over the
          conversation during ordinary use. */}
      {!atLatest && onReturnToLatest ? (
        <Pressable
          onPress={onReturnToLatest}
          accessibilityRole="button"
          accessibilityLabel="Jump to latest messages"
          className="absolute bottom-4 self-center rounded-full bg-primary px-4 py-2 shadow-lg"
        >
          <Text className="text-sm font-semibold text-white">
            Jump to latest
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
