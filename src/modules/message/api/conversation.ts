import {
  Message,
  MessageAttachment,
  MessagePageResponse,
} from "./types";

/**
 * The shape TanStack Query keeps for an infinite query of messages.
 *
 * Two orderings meet here and it is worth being explicit about both, because
 * getting either backwards puts the conversation on screen in the wrong order.
 *
 * Within a page, items run oldest first -- the order the messages were said in,
 * which is what the server returns.
 *
 * Across pages, page 0 is the *newest* chunk and each subsequent page reaches
 * further back, because scrolling up fetches the next page. So the single
 * newest message the client holds is the last item of the first page.
 */
export type MessagePages = {
  pages: MessagePageResponse[];
  pageParams: unknown[];
};

/**
 * How far a message has got.
 *
 * A message with no delivery state is one the server has confirmed. The field
 * is absent rather than carrying a "sent" value so that every message already
 * in the cache, and every message the REST API returns, is already correct
 * without having to be migrated or defaulted.
 */
export type DeliveryState = "sending" | "failed";

/**
 * A message as it exists in a conversation, which may not yet be confirmed.
 */
export type ConversationMessage = Message & {
  /** Correlates an optimistic copy with the broadcast that confirms it. */
  client_id?: string;
  delivery?: DeliveryState;
};

export type PendingMessage = ConversationMessage & {
  client_id: string;
  delivery: DeliveryState;
};

/**
 * Builds the copy of a message drawn before the server has seen it.
 *
 * Sending used to write nothing to the cache: the frame went out over the
 * socket and the message appeared only once the server echoed it back. On a
 * good connection that reads as lag. On a bad one the input clears and nothing
 * appears at all, so the text the user just typed is simply gone from the
 * screen with no indication of whether it was sent — and the natural response
 * is to type it again, which is how a duplicate gets created when the socket
 * recovers and both copies flush.
 */
export function createPendingMessage(params: {
  clientId: string;
  workspaceId: string;
  senderId: string;
  content: string;
  replyToId?: string;
  attachment?: MessageAttachment;
}): PendingMessage {
  return {
    // The correlation id doubles as the row key until the server supplies a
    // real one. It has to be stable across a retry so the list does not
    // remount the row and lose its position.
    id: params.clientId,
    client_id: params.clientId,

    workspace_id: params.workspaceId,
    sender_id: params.senderId,
    content: params.content,
    reply_to_id: params.replyToId,

    // Already uploaded by the time the message is sent, so the optimistic copy
    // can show the real filename rather than a placeholder that changes once
    // the server replies.
    attachment: params.attachment,

    created_at: new Date().toISOString(),

    delivery: "sending",
  } as PendingMessage;
}

/**
 * Places a message that arrived over the socket into the cached conversation.
 *
 * An arriving message is newer than everything cached, and the newest end of
 * the cache is the *end* of page 0 -- pages run oldest first internally even
 * though page 0 is the newest chunk. Putting it at the front of page 0 instead
 * would bury the newest message among the oldest of that chunk, which is why
 * messages once appeared not to arrive at all.
 *
 * The caller must not offer a message when the loaded window has been detached
 * from the live end -- when the reader has jumped back into history. There is a
 * gap between the window and now, and splicing a message from a moment ago into
 * it would show it directly above one from two months ago.
 *
 * The same message can legitimately be delivered twice: the sender is a member
 * of the room they are broadcasting to, and a reconnect can race a refetch. It
 * is matched on id and ignored the second time rather than rendered twice.
 */
export function insertIncomingMessage(
  cache: MessagePages | undefined,
  message: ConversationMessage,
): MessagePages | undefined {
  // Nothing has been loaded yet. Seeding a page here would invent a
  // conversation consisting of one message and let the query believe it had
  // already fetched, so the rest of the history would never load.
  if (!cache || cache.pages.length === 0) {
    return cache;
  }

  // The sender's own message comes back over the room it was broadcast to.
  // Replacing the optimistic copy in place — rather than dropping it and
  // prepending the confirmed one — keeps the row identity stable, so the
  // message does not visibly jump as it settles.
  //
  // Matching on content and timestamp instead would fail in exactly the case
  // that occurs most: the same short reply sent twice ("ok", "thanks"), where
  // the wrong copy gets confirmed and the other never clears.
  if (message.client_id) {
    const pendingIndex = cache.pages[0].items.findIndex(
      (item) => (item as ConversationMessage).client_id === message.client_id,
    );

    if (pendingIndex !== -1) {
      const items = [...cache.pages[0].items];

      // `client_id` and `delivery` are both dropped: the absence of a delivery
      // state is what marks a message confirmed, and a stale "sending" left
      // behind would strand the row mid-flight forever.
      items[pendingIndex] = stripTransportFields(message);

      return {
        ...cache,
        pages: cache.pages.map((page, index) =>
          index === 0 ? { ...page, items } : page,
        ),
      };
    }
  }

  const alreadyPresent = cache.pages.some((page) =>
    page.items.some((item) => item.id === message.id),
  );

  if (alreadyPresent) {
    return cache;
  }

  // Fallback for a server that does not echo the correlation id: an arriving
  // message from this same sender, with text identical to something still in
  // flight, is that message coming back. Only the oldest such candidate is
  // consumed, so two identical messages sent in a row are confirmed in the
  // order they were sent rather than one of them being confirmed twice while
  // the other is stranded.
  //
  // This exists because the alternative failure is not a cosmetic one: without
  // it an unconfirmed message sits marked "Sending…" indefinitely and is then
  // reported as failed, telling the user a message was lost when it was in
  // fact delivered.
  const unconfirmed = cache.pages[0].items
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- the assertion narrows Message to ConversationMessage; removing it fails tsc with "Property 'delivery' does not exist on type 'Message'"
    .map((item, index) => ({ item: item as ConversationMessage, index }))
    .filter(
      ({ item }) =>
        item.delivery === "sending" &&
        item.content === message.content &&
        item.sender_id === message.sender_id,
    )
    // The first match, because a page runs oldest first. This used to take the
    // last, which was the oldest back when pages ran newest first; left alone
    // through the change to cursor paging it would have confirmed the most
    // recent duplicate and stranded the one that was actually sent first.
    .at(0);

  if (unconfirmed) {
    const items = [...cache.pages[0].items];
    items[unconfirmed.index] = stripTransportFields(message);

    return {
      ...cache,
      pages: cache.pages.map((page, index) =>
        index === 0 ? { ...page, items } : page,
      ),
    };
  }

  const pages = cache.pages.map((page, index) =>
    index === 0
      ? { ...page, items: [...page.items, stripTransportFields(message)] }
      : page,
  );

  return { ...cache, pages };
}

/**
 * Replaces a message that has been edited, wherever it sits in the cache.
 *
 * An edit is not an arrival and must not be inserted: appending it would show
 * the message twice, and treating it as a duplicate would discard the new text
 * and keep displaying words the sender has already corrected.
 */
export function replaceMessage(
  cache: MessagePages | undefined,
  message: Message,
): MessagePages | undefined {
  if (!cache) {
    return cache;
  }

  return {
    ...cache,
    pages: cache.pages.map((page) => {
      const index = page.items.findIndex((item) => item.id === message.id);

      if (index === -1) {
        return page;
      }

      const items = [...page.items];

      // The stored copy is merged over rather than replaced outright, so the
      // per-reader fields the edit response does not carry — whether this
      // viewer had seen it, and when — are not silently reset.
      items[index] = { ...items[index], ...message };

      return { ...page, items };
    }),
  };
}

/**
 * Removes the fields that belong to the socket frame rather than the message.
 */
function stripTransportFields(message: ConversationMessage): Message {
  const { client_id: _clientId, delivery: _delivery, ...rest } = message;

  return rest;
}

/**
 * Adds a message the user has just sent, before the server has confirmed it.
 */
export function insertPendingMessage(
  cache: MessagePages | undefined,
  message: PendingMessage,
): MessagePages | undefined {
  if (!cache || cache.pages.length === 0) {
    return cache;
  }

  const pages = cache.pages.map((page, index) =>
    index === 0 ? { ...page, items: [...page.items, message] } : page,
  );

  return { ...cache, pages };
}

/**
 * Marks an unconfirmed message as failed.
 *
 * The message is kept rather than removed. Deleting it would take the user's
 * words off the screen, which is the behaviour this whole mechanism exists to
 * prevent; leaving it visible and marked failed means the text can still be
 * read, copied, or retried.
 */
export function markMessageFailed(
  cache: MessagePages | undefined,
  clientId: string,
): MessagePages | undefined {
  if (!cache) {
    return cache;
  }

  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        (item as ConversationMessage).client_id === clientId
          ? ({ ...item, delivery: "failed" } as ConversationMessage)
          : item,
      ),
    })),
  };
}

/**
 * Removes an unconfirmed message, so that a retry can re-send it cleanly.
 */
export function removePendingMessage(
  cache: MessagePages | undefined,
  clientId: string,
): MessagePages | undefined {
  if (!cache) {
    return cache;
  }

  return {
    ...cache,
    pages: cache.pages.map((page) => {
      const items = page.items.filter(
        (item) => (item as ConversationMessage).client_id !== clientId,
      );

      return items.length === page.items.length ? page : { ...page, items };
    }),
  };
}

/**
 * Flattens the cached pages into the order an inverted list expects.
 *
 * `FlatList inverted` renders index 0 at the bottom, and a conversation reads
 * with its newest message at the bottom -- so the flattened array runs newest
 * first.
 *
 * The pages already run newest chunk first, but each page runs oldest first
 * inside itself, so every page is reversed on the way out. Concatenating them
 * unreversed reads each chunk backwards while stepping through the chunks
 * forwards, which is subtly wrong in a way that only shows up as messages
 * appearing out of order within a screenful.
 */
export function flattenConversation(
  cache: MessagePages | undefined,
): ConversationMessage[] {
  if (!cache) {
    return [];
  }

  return cache.pages.flatMap((page) => [...page.items].reverse());
}
