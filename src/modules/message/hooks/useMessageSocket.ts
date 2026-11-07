import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { websocketClient } from "@/core/websocket/client";
import { WS_EVENTS } from "@/core/websocket/events";
import { queryKeys } from "@/core/query/queryKeys";
import { tokenService } from "@/core/auth/tokenService";

import {
  ConversationMessage,
  insertIncomingMessage,
  MessagePages,
  replaceMessage,
} from "../api/conversation";

type Props = {
  workspaceId: string;
  token: string;

  /**
   * Whether the loaded conversation still reaches its newest message.
   *
   * False while the reader is looking at old history, when there is a gap
   * between what is loaded and now. Defaults to true so a caller that has no
   * concept of a detached window behaves as it always did.
   */
  accepting?: boolean;
};

export function useMessageSocket({
  workspaceId,
  token,
  accepting = true,
}: Props) {
  const queryClient = useQueryClient();

  // Read through a ref rather than a dependency. As a dependency it would tear
  // the subscription down and rejoin the room every time the reader jumped
  // into history or came back, which drops frames across the gap.
  const acceptingRef = useRef(accepting);
  acceptingRef.current = accepting;

  useEffect(() => {
    // Joining is registered as a reconnect action rather than sent once. The
    // socket may not be open yet, and more importantly it may drop and come
    // back later; a join sent only at mount would be lost on every reconnect,
    // leaving the socket connected but silent.
    const leaveRoom = websocketClient.joinRoom(WS_EVENTS.WORKSPACE_JOIN, WS_EVENTS.WORKSPACE_LEAVE, {
      workspace_id: workspaceId,
    });

    websocketClient.connect(() => tokenService.getAccessToken() ?? token);

    const unsubscribe = websocketClient.listen((event) => {
      if (
        event.type !== WS_EVENTS.MESSAGE_CREATED &&
        event.type !== WS_EVENTS.MESSAGE_UPDATED
      ) {
        return;
      }

      // The frame carries the sender's correlation id alongside the message,
      // so that the sender can recognise its own optimistic copy rather than
      // rendering the confirmation as a second message.
      const message = event.payload as ConversationMessage;

      // A socket is shared across screens, so a message for another workspace
      // can arrive here. Writing it into this conversation would show one
      // client's message inside another's thread.
      if (message.workspace_id !== workspaceId) {
        return;
      }

      // An edit replaces a message that is already on screen. Routing it
      // through the insert path instead would either show the message twice or,
      // once it was recognised as a duplicate, discard the correction and go on
      // displaying text the sender has already fixed.
      const isEdit = event.type === WS_EVENTS.MESSAGE_UPDATED;

      // An arrival is dropped while the window is detached, because it belongs
      // at a newest end the cache does not currently hold; it comes back with
      // the refetch when the reader returns to the live end. An edit is applied
      // either way -- it only rewrites a message already in the cache, so it
      // cannot land in the wrong place, and skipping it would leave text on
      // screen the sender has already corrected.
      if (!isEdit && !acceptingRef.current) {
        return;
      }

      const apply = isEdit ? replaceMessage : insertIncomingMessage;

      queryClient.setQueryData<MessagePages>(
        queryKeys.messages.workspace(workspaceId),
        (cache) => apply(cache, message),
      );
    });

    return () => {
      unsubscribe();
      leaveRoom();
    };
  }, [workspaceId, token, queryClient]);
}
