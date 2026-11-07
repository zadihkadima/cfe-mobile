/**
 * A file attached to a message.
 *
 * The message carries a summary rather than a reference the client has to
 * resolve, so a conversation renders without one request per attached file.
 * The file itself lives in the workspace's documents — it is uploaded through
 * the ordinary file endpoint, which is what makes it appear in the client's
 * file list as well as in the conversation.
 */
export interface MessageAttachment {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
}

export interface Message {
  id: string;

  workspace_id: string;

  sender_id: string;

  /**
   * The sender's display name, resolved by the server.
   *
   * Server-side because a workspace conversation involves managers,
   * administrators and the client, and administrators are deliberately absent
   * from the workspace members endpoint -- so this cannot be looked up here.
   * Optional because the server resolves it on a best-effort basis.
   */
  sender_name?: string;

  /**
   * A link to the sender's picture, absent when they have not set one. The
   * bubble falls back to initials, so absence is a rendering choice rather
   * than a broken image.
   */
  sender_avatar_url?: string;

  content: string;

  reply_to_id?: string;
  // Small summary of the parent message when this message is a reply.
  reply_to?: {
    id: string;
    sender_id: string;
    sender_name?: string;
    sender_avatar_url?: string;
    content?: string;
  };
  is_broadcast: boolean;

  attachment?: MessageAttachment;

  seen: boolean;
  seen_by_count: number;
  seen_at?: string;

  /**
   * Who has read this message, excluding its sender.
   *
   * A count alone is not much use in a group: "seen by 2" of four
   * participants leaves the only question worth asking -- which two --
   * unanswered. Absent on a message nobody else has opened yet.
   */
  seen_by?: {
    user_id: string;
    name?: string;
    avatar_url?: string;
    seen_at: string;
  }[];

  /**
   * Absent unless the message has been changed since it was sent. It is a
   * timestamp rather than a flag so a reader can tell how long after the fact
   * the correction was made.
   */
  edited_at?: string;

  created_at: string;

  /**
   * This message's own position in the conversation.
   *
   * On every message rather than only on the ends of a page, which is what
   * makes "jump to the message this replies to" possible without a second
   * endpoint: the client already holds the quoted message, so it can open a
   * window at it directly.
   *
   * Optional because a message that has not reached the server yet -- one still
   * being sent -- has no position, and because the offset list endpoint does
   * not carry it.
   */
  cursor?: string;
}

/**
 * Which way a page is read.
 *
 * `older` is what scrolling up asks for; `newer` is what scrolling back down
 * asks for after a reader has jumped to an old message.
 */
export type MessageDirection = "older" | "newer";

export interface GetMessagePageRequest {
  workspaceId: string;

  /** Absent for the first page, which starts at the newest message. */
  cursor?: string;

  direction?: MessageDirection;

  limit?: number;

  /**
   * Whether the cursor's own message belongs in the page.
   *
   * Only used when opening a window at a specific message. Continuing a scroll
   * must leave it off, or the row the last page stopped at appears twice.
   */
  include?: boolean;
}

/**
 * One page of a conversation, read from a position rather than an offset.
 *
 * There is no total. Counting a conversation is a scan that grows with every
 * message ever sent, to produce a number nothing on screen displays. "Is there
 * more" is the only question a scrolling reader asks.
 *
 * Items are oldest first, which is the order they were said in -- not the order
 * an inverted list renders them in.
 */
export interface MessagePageResponse {
  items: Message[];

  has_more: boolean;

  limit: number;

  /** Absent when the page is empty. */
  oldest_cursor?: string;
  newest_cursor?: string;
}

export interface CreateMessageRequest {
  content: string;
  reply_to_id?: string;
  is_broadcast?: boolean;
  attachment_file_id?: string;
}

export interface UpdateMessageRequest {
  content: string;
}