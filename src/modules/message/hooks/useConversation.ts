import { useCallback, useState } from "react";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";

import { getMessagePage, getMessageById } from "../api/api";

import { MessageDirection, MessagePageResponse } from "../api/types";

/**
 * How many pages of a conversation are kept in memory at once.
 *
 * A conversation has no natural end, and a reader scrolling through months of
 * history would otherwise accumulate every message they passed. Six pages of
 * thirty is a few screens in either direction -- enough that ordinary scrolling
 * never hits the edge, and little enough that the list stays responsive on a
 * cheap device.
 *
 * Reaching the limit drops pages from the far end, so scrolling up discards the
 * newest and scrolling down discards the oldest. Nothing is lost: a dropped
 * page is refetched by its cursor if the reader turns around.
 */
export const MAX_CONVERSATION_PAGES = 6;

const PAGE_SIZE = 30;

/**
 * Whether the loaded window has come away from the newest message.
 *
 * Two ways that happens, and both matter. The obvious one is anchoring: the
 * reader followed a reply into old history, so the window was rebuilt around a
 * message somewhere in the past.
 *
 * The other is trimming, and it is easy to miss. Scrolling up past the page
 * limit drops the newest page to keep memory bounded, and from that moment the
 * window no longer reaches the live end even though nothing was anchored. An
 * arriving message appended to what is now the first page would land in the
 * middle of the history rather than at the end of the conversation.
 *
 * The test is `>=` rather than `>`, which treats a full-but-untrimmed window as
 * detached. That is one page early, and deliberately so: it costs a wasted
 * empty request at worst, where being one page late costs a message rendered in
 * the wrong place.
 */
function isDetached(anchorCursor: string | null, pageCount: number) {
  return anchorCursor !== null || pageCount >= MAX_CONVERSATION_PAGES;
}

/**
 * Where a page starts and which way it reads.
 */
export type ConversationPageParam = {
  cursor?: string;
  direction: MessageDirection;

  /** Only set for the page that opens a window at a specific message. */
  include?: boolean;
};

type Props = {
  workspaceId: string;
};

/**
 * A conversation that can be scrolled in both directions.
 *
 * The window is anchored at the newest message by default. Following a reply to
 * a message that is not loaded re-anchors it there instead, which is what makes
 * a jump into old history cheap: the client asks for a window around one
 * message rather than fetching every page between here and there.
 */
export function useConversation({ workspaceId }: Props) {
  const queryClient = useQueryClient();

  const conversationKey = queryKeys.messages.workspace(workspaceId);

  /**
   * The message the window is currently built around, or null at the live end.
   *
   * Held here rather than in the query key so that the key stays one per
   * workspace. The socket writes arriving messages into that key, and a key
   * that changed as the reader navigated would leave those writes landing in a
   * cache entry nothing was rendering.
   */
  const [anchorCursor, setAnchorCursor] = useState<string | null>(null);

  const query = useInfiniteQuery({
    queryKey: conversationKey,

    queryFn: ({ pageParam }) =>
      getMessagePage({ workspaceId, ...pageParam, limit: PAGE_SIZE }),

    // Read as an option on every render, so re-anchoring and then resetting the
    // query rebuilds the window at the new position without changing the key.
    initialPageParam: anchorCursor
      ? ({ cursor: anchorCursor, direction: "older", include: true } as const)
      : ({ direction: "older" } as const),

    // "Next" is further back in time. On an inverted list that is upwards,
    // which is the direction a reader scrolls to read history.
    getNextPageParam: (
      lastPage: MessagePageResponse,
    ): ConversationPageParam | undefined =>
      lastPage.has_more && lastPage.oldest_cursor
        ? { cursor: lastPage.oldest_cursor, direction: "older" }
        : undefined,

    // "Previous" is forwards in time, and is only reachable in two situations:
    // the reader jumped into history and is coming back down, or they scrolled
    // up far enough that the newest page was trimmed off the window.
    //
    // Guarded rather than always offered, because at the live end there is
    // nothing newer to fetch -- messages arrive over the socket -- and an
    // unguarded version fires a request the moment the screen opens, since the
    // bottom of an inverted list is where the reader already is.
    getPreviousPageParam: (
      firstPage: MessagePageResponse,
      allPages: MessagePageResponse[],
    ): ConversationPageParam | undefined =>
      isDetached(anchorCursor, allPages.length) && firstPage.newest_cursor
        ? { cursor: firstPage.newest_cursor, direction: "newer" }
        : undefined,

    maxPages: MAX_CONVERSATION_PAGES,
  });

  /**
   * Rebuild the window around a given message.
   *
   * The message is resolved by id first because a cursor is a position, and the
   * client holding a reply knows the id of what it quotes but not where that
   * sits in the conversation. The reply summary deliberately does not carry a
   * cursor: it is a snapshot taken when the reply was written, and a position
   * copied at that moment would still be correct but would have to be kept in
   * step with every message that has one.
   */
  const anchorTo = useCallback(
    async (messageId: string) => {
      const message = await getMessageById(workspaceId, messageId);

      if (!message.cursor) {
        return false;
      }

      setAnchorCursor(message.cursor);

      // Discards the loaded pages and refetches from `initialPageParam`, which
      // now names the anchor. Resetting rather than invalidating matters: an
      // invalidation refetches each existing page at its own cursor, which
      // would faithfully rebuild the window the reader is trying to leave.
      await queryClient.resetQueries({ queryKey: conversationKey });

      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- conversationKey is rebuilt each render from workspaceId, which is already a dependency
    [workspaceId, queryClient],
  );

  /**
   * Return to the live end of the conversation.
   */
  const returnToLatest = useCallback(async () => {
    setAnchorCursor(null);

    await queryClient.resetQueries({ queryKey: conversationKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- conversationKey is rebuilt each render from workspaceId, which is already a dependency
  }, [workspaceId, queryClient]);

  return {
    ...query,

    /**
     * Whether the window still reaches the newest message.
     *
     * The screen needs this for more than a badge: while the window is detached
     * an arriving message must not be spliced into the loaded pages, because
     * there is a gap between them and live, and inserting it would show a
     * message from a moment ago directly above one from two months ago.
     *
     * Computed from the same rule that decides whether there is a page below
     * the window, so the button offering a way back and the paging that carries
     * the reader there can never disagree about where they are.
     */
    atLatest: !isDetached(anchorCursor, query.data?.pages.length ?? 0),

    anchorTo,
    returnToLatest,
  };
}
