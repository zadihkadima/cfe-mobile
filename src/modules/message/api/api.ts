import { api } from "@/core/api/client";

import {
  CreateMessageRequest,
  GetMessagePageRequest,
  Message,
  MessagePageResponse,
  UpdateMessageRequest,
} from "./types";

/**
 * Reads one page of a conversation from a position in it.
 *
 * Offsets cannot page a conversation. A page number is resolved against a count
 * taken at the moment of the request, and a chat room is the one list where
 * rows are inserted at the boundary being read constantly: somebody sends a
 * message while the reader is scrolling, every offset shifts by one, and the
 * next page repeats a message they already have or skips one they never saw.
 *
 * A cursor names the message the reader stopped at, so the next page starts
 * from that message rather than from a position whose meaning has moved.
 */
export async function getMessagePage({
  workspaceId,
  cursor,
  direction = "older",
  limit = 30,
  include = false,
}: GetMessagePageRequest) {
  const { data } = await api.get<MessagePageResponse>(
    `/workspaces/${workspaceId}/messages/page`,
    {
      params: {
        // Omitted rather than sent empty, so the server sees the absence that
        // means "start at the newest message" instead of a cursor it has to
        // reject as malformed.
        ...(cursor ? { cursor } : {}),
        ...(include ? { include: true } : {}),
        direction,
        limit,
      },
    },
  );

  return data;
}

export async function createMessage(
  workspaceId: string,
  payload: CreateMessageRequest,
) {
  const { data } = await api.post<Message>(
    `/workspaces/${workspaceId}/messages`,
    payload,
  );

  return data;
}

export async function markWorkspaceMessagesRead(
  workspaceId: string,
) {
  await api.patch(`/workspaces/${workspaceId}/messages/read`);
}

/**
 * Rewrites the text of a message the current user sent.
 *
 * The workspace is in the path even though the message id alone would identify
 * the row, because that is what the server authorizes against. A message
 * addressed through the wrong workspace is refused.
 */
export async function updateMessage(
  workspaceId: string,
  messageId: string,
  payload: UpdateMessageRequest,
) {
  const { data } = await api.patch<Message>(
    `/workspaces/${workspaceId}/messages/${messageId}`,
    payload,
  );

  return data;
}

/**
 * Reads a single message.
 *
 * Used to resolve the position of a message the client knows the id of but has
 * not loaded -- the one a reply quotes, most often. The reply summary carries
 * the id and an excerpt, not a cursor, so opening a window at the original
 * means asking the server where it sits.
 */
export async function getMessageById(workspaceId: string, messageId: string) {
  const { data } = await api.get<Message>(
    `/workspaces/${workspaceId}/messages/${messageId}`,
  );

  return data;
}
