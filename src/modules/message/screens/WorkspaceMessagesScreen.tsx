import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as DocumentPicker from "expo-document-picker";

import {
  getWorkspaceFileAccessUrl,
  uploadWorkspaceFile,
} from "@/core/api/uploadWorkspaceFile";

import {
  useMemo,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useConversation,
} from "../hooks/useConversation";

import {
  useMessageSocket,
} from "../hooks/useMessageSocket";

import {
  MessageList,
} from "../components/MessageList";

import {
  EditingMessage,
  MessageInput,
} from "../components/MessageInput";

import { useUpdateMessage } from "../hooks/useUpdateMessage";

import { ConnectionBanner } from "../components/ConnectionBanner";
import { useKeyboardVisible } from "@/core/hooks/useKeyboardVisible";
import { useTransferProgress } from "@/core/api/useTransferProgress";
import { downloadAndOpenFile } from "@/core/api/downloadWorkspaceFile";
import { TransferProgressBar } from "@/design-system/ui/feedback/TransferProgressBar";
import { KeyboardAvoidingContainer } from "@/design-system/ui/layout/KeyboardAvoidingContainer";

import { useConnectionStatus } from "@/core/websocket/useConnectionStatus";

import {
  websocketClient,
} from "@/core/websocket/client";

import {
  WS_EVENTS,
} from "@/core/websocket/events";

import { markWorkspaceMessagesRead } from "../api/api";
import { MessageAttachment } from "../api/types";
import {
  createPendingMessage,
  flattenConversation,
  insertPendingMessage,
  markMessageFailed,
  MessagePages,
  removePendingMessage,
} from "../api/conversation";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/core/query/queryKeys";
import { createClientId } from "@/core/websocket/clientId";

/**
 * How long an unconfirmed message waits before it is shown as failed.
 *
 * The socket queues anything sent while it is down, so a send during an outage
 * produces no error at all -- it simply never arrives, and without a deadline
 * the message would sit marked "sending" for as long as the screen was open.
 *
 * Five seconds is short enough that a message which is not going to arrive is
 * reported before the user has moved on and stopped looking. It can be this
 * short because the connection state is now on screen: a message marked failed
 * while the banner reads "Connecting" explains itself, whereas previously the
 * only signal was the message, so the deadline had to be generous enough to
 * never be wrong about a slow but healthy connection.
 */
const SEND_CONFIRMATION_TIMEOUT_MS = 5_000;

type SendPayload = {
  content: string;
  replyToId?: string;
  attachment?: MessageAttachment;
};


type Props = {
  workspaceId: string;

  workspaceName?: string;

  token: string;

  currentUserId: string;
};


export function WorkspaceMessageScreen({
  workspaceId,
  workspaceName: _workspaceName = "Messages",
  token,
  currentUserId,
}: Props) {


  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    atLatest,
    anchorTo,
    returnToLatest,
  } = useConversation({
    workspaceId,
  });



  useMessageSocket({
    workspaceId,
    token,

    // While the reader is looking at old history there is a gap between the
    // loaded window and now, and splicing an arriving message into it would
    // show a message from a moment ago directly above one from months back.
    // It is not lost: coming back to the live end refetches from the server.
    accepting: atLatest,
  });

  const connectionStatus = useConnectionStatus();



const messages =
  useMemo(
    () => flattenConversation(data),
    [data],
  );

  const [replyToId, setReplyToId] = useState<string | undefined>(undefined);
  const [showMessageCount, setShowMessageCount] = useState(true);

  const { transfer, track } = useTransferProgress();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();

  const queryClient = useQueryClient();
  const conversationKey = queryKeys.messages.workspace(workspaceId);

  // Timers are tracked so that leaving the screen does not leave a callback
  // waiting to write into a cache for a conversation no longer on screen.
  const pendingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = pendingTimers.current;

    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  useEffect(() => {
    // Only from the live end. A reader who jumped back to follow a reply has
    // not seen the months of conversation between there and now, and marking
    // it read would clear an unread badge for messages they never opened.
    if (!atLatest) {
      return;
    }

    void markWorkspaceMessagesRead(workspaceId);
  }, [workspaceId, messages.length, atLatest]);

  useEffect(() => {
    setShowMessageCount(true);

    const dismiss = setTimeout(() => setShowMessageCount(false), 2_500);

    return () => clearTimeout(dismiss);
  }, [workspaceId]);

  // A message that has been confirmed no longer has a timeout to serve. The
  // timer was previously left to expire on its own: harmless in isolation,
  // since it could no longer find the message to mark, but it meant a long
  // conversation accumulated one live timer per message sent, all of them
  // holding the query client and the conversation key alive.
  //
  // Reconciling against the cache rather than clearing at the point of
  // confirmation matters, because confirmation happens in the socket hook,
  // which has no knowledge of these timers.
  useEffect(() => {
    const inFlight = new Set(
      messages
        .filter((item) => item.delivery === "sending")
        .map((item) => item.client_id),
    );

    pendingTimers.current.forEach((timer, clientId) => {
      if (inFlight.has(clientId)) {
        return;
      }

      clearTimeout(timer);
      pendingTimers.current.delete(clientId);
    });
  }, [messages]);

  const [editing, setEditing] = useState<EditingMessage | undefined>(undefined);

  const { mutate: submitEdit } = useUpdateMessage(workspaceId);

  /**
   * Sends a message and draws it immediately.
   *
   * The send used to hand the frame to the socket and stop there, so the
   * message appeared only when the server echoed it back. The input cleared
   * the instant send was pressed, which meant that on a slow or broken
   * connection the user's text left the screen entirely with nothing to show
   * it had been sent — and the natural response, retyping it, is what produces
   * the duplicate once the socket recovers and both copies flush.
   */
  function sendMessage(payload: SendPayload) {
    const clientId = createClientId();

    queryClient.setQueryData<MessagePages>(conversationKey, (cache) =>
      insertPendingMessage(
        cache,
        createPendingMessage({
          clientId,
          workspaceId,
          senderId: currentUserId,
          content: payload.content,
          replyToId: payload.replyToId,
          attachment: payload.attachment,
        }),
      ),
    );

    websocketClient.send(WS_EVENTS.MESSAGE_SEND, {
      workspace_id: workspaceId,
      content: payload.content,
      reply_to_id: payload.replyToId,

      // Only the id travels. The file itself was uploaded through the ordinary
      // file endpoint before this ran, which is what puts it in the client's
      // documents rather than leaving it buried in a conversation.
      attachment_file_id: payload.attachment?.id,

      // Echoed back on the broadcast so the confirmation can be matched to
      // this exact message. Matching on text and time instead breaks on the
      // most ordinary case there is: the same short reply sent twice.
      client_id: clientId,
    });

    const timer = setTimeout(() => {
      pendingTimers.current.delete(clientId);

      queryClient.setQueryData<MessagePages>(conversationKey, (cache) =>
        markMessageFailed(cache, clientId),
      );
    }, SEND_CONFIRMATION_TIMEOUT_MS);

    pendingTimers.current.set(clientId, timer);

    setReplyToId(undefined);
  }
  /**
   * Re-sends a message that never arrived.
   *
   * The failed copy is removed and a fresh one inserted rather than the old
   * one revived, so the retry gets its own correlation id. Reusing the first
   * would mean a late confirmation of the original send resolving the retry,
   * and the message being delivered twice while the screen showed one.
   */
  function retryMessage(
    clientId: string,
    content: string,
    replyTo?: string,
    attachment?: MessageAttachment,
  ) {
    const timer = pendingTimers.current.get(clientId);

    if (timer) {
      clearTimeout(timer);
      pendingTimers.current.delete(clientId);
    }

    queryClient.setQueryData<MessagePages>(conversationKey, (cache) =>
      removePendingMessage(cache, clientId),
    );

    // The file is already uploaded and still referenced by id, so a retry does
    // not re-upload it. Uploading again would leave an orphaned copy in the
    // client's documents for every failed attempt.
    sendMessage({ content, replyToId: replyTo, attachment });
  }

  /**
   * Uploads a picked file and returns what to attach to the message.
   *
   * The file goes through the same endpoint as any other workspace upload, and
   * deliberately so: a document sent in a conversation is the same document as
   * one uploaded from the files screen. It is versioned with them, listed with
   * them, and deleted with them. Storing it only against the message would put
   * a client's paperwork somewhere nobody thinks to look.
   */
  async function pickAttachment(): Promise<MessageAttachment | null> {
    const picked = await DocumentPicker.getDocumentAsync({ multiple: false });

    if (picked.canceled || !picked.assets?.length) {
      return null;
    }

    const asset = picked.assets[0];

    const uploaded = await track(asset.name, (onProgress) =>
      uploadWorkspaceFile(
        workspaceId,
        { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
        { onProgress },
      ),
    );

    // The workspace file list is now stale by exactly this file. Invalidating
    // is what makes an attachment appear under the client's documents without
    // the user having to reload the screen to discover it arrived.
    void queryClient.invalidateQueries({
      queryKey: ["workspace-files", workspaceId],
    });

    return {
      id: uploaded.id,
      name: uploaded.original_name,
      mime_type: uploaded.mime_type,
      size_bytes: uploaded.size_bytes,
    };
  }

  async function openAttachment(attachment: MessageAttachment) {
    try {
      // Fetched now rather than held from when the message was drawn. Access
      // URLs last ten minutes, so one captured when the conversation opened is
      // already dead by the time somebody scrolls back and taps it. Asking
      // again costs a request and always yields a URL that works.
      const url = await getWorkspaceFileAccessUrl(workspaceId, attachment.id);

      await track(
        attachment.name,
        (onProgress) => downloadAndOpenFile(url, attachment.name, onProgress),
        "Downloading",
      );
    } catch {
      // A file that cannot be opened is not a reason to tear down the
      // conversation around it.
    }
  }



  return (
    // The conversation is the one screen where the bottom of the window is
    // load-bearing: the composer lives there. Everything below is about
    // keeping it reachable.
    <KeyboardAvoidingContainer className="flex-1 bg-background dark:bg-dark-background">
      {showMessageCount ? (
        <View className="border-b border-border bg-surface px-5 py-3 dark:border-dark-border dark:bg-dark-surface">
          <Text className="text-center text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </Text>
        </View>
      ) : null}

      <View className="flex-1">

        <MessageList

          messages={
            messages
          }


          currentUserId={
            currentUserId
          }

          workspaceId={workspaceId}


          onLoadMore={() => {

            if (
              hasNextPage
            ) {
              // Not awaited: this fires from a scroll handler, and react-query
              // surfaces both the loading and the error state through the
              // query itself, so there is nothing for the caller to do with
              // the promise.
              void fetchNextPage();
            }

          }}


          canLoadMore={Boolean(
            hasNextPage,
          )}


          loadingMore={
            isFetchingNextPage
          }

          onLoadNewer={() => {
            void fetchPreviousPage();
          }}

          canLoadNewer={Boolean(hasPreviousPage)}

          loadingNewer={isFetchingPreviousPage}

          onAnchorTo={anchorTo}

          atLatest={atLatest}

          onReturnToLatest={() => {
            void returnToLatest();
          }}

          onReply={(messageId) => {
            setReplyToId(messageId);
          }}

          onRetry={(message) => {
            if (!message.client_id) {
              return;
            }

            retryMessage(
              message.client_id,
              message.content,
              message.reply_to_id,
              message.attachment,
            );
          }}

          onEdit={(message) => {
            // Editing and replying are mutually exclusive: the composer holds
            // one draft, and leaving a reply target attached to an edit would
            // send the correction as though it were a new reply.
            setReplyToId(undefined);
            setEditing({ id: message.id, content: message.content });
          }}

          onOpenAttachment={(attachment) => {
            void openAttachment(attachment);
          }}

        />

      </View>

      {/* Directly above the composer, which is where somebody about to type
          is already looking. At the top of the screen it would sit behind the
          keyboard the moment they started. */}
      <ConnectionBanner status={connectionStatus} />

      {/* Beside the connection banner for the same reason: an attachment is
          sent from the composer, so that is where the person who sent it is
          looking while it uploads. */}
      {transfer && (
        <View className="px-4">
          <TransferProgressBar
            name={transfer.name}
            progress={transfer.progress}
            verb={transfer.verb}
          />
        </View>
      )}

      {/* The layout above this screen reserves the top inset but not the
          bottom one, so the composer was sitting underneath the home indicator
          with part of it untappable. The inset is applied here rather than
          around the whole screen because it must disappear while the keyboard
          is up -- otherwise it leaves a gap the height of the gesture bar
          floating between the composer and the keyboard. */}
      <View
        style={{
          paddingBottom: keyboardVisible ? 0 : insets.bottom,
        }}
      >
        <MessageInput

        onSend={
          sendMessage
        }

        replyToId={replyToId}

        onClearReply={() => setReplyToId(undefined)}

        editing={editing}

        onSubmitEdit={(messageId, content) => {
          submitEdit({ messageId, content });
          setEditing(undefined);
        }}

        onCancelEdit={() => setEditing(undefined)}

        onPickAttachment={pickAttachment}

      />
      </View>

    </KeyboardAvoidingContainer>

  );
}