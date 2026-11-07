import {
  createPendingMessage,
  flattenConversation,
  insertIncomingMessage,
  insertPendingMessage,
  markMessageFailed,
  MessagePages,
  removePendingMessage,
  replaceMessage,
} from "./conversation";
import { createClientId } from "@/core/websocket/clientId";
import { Message } from "./types";

function message(id: string, createdAt: string): Message {
  return {
    id,
    workspace_id: "w1",
    sender_id: "u1",
    content: `message ${id}`,
    is_broadcast: false,
    seen: false,
    seen_by_count: 0,
    created_at: createdAt,
  };
}

// Page 0 is the newest batch and later pages reach further back, because
// scrolling up fetches the next page. Within a page, items run oldest first --
// the order they were said in, which is what the server returns.
function conversation(): MessagePages {
  return {
    pages: [
      {
        items: [
          message("middle", "2026-01-02"),
          message("newest", "2026-01-03"),
        ],
        has_more: true,
        limit: 2,
      },
      {
        items: [message("oldest", "2026-01-01")],
        has_more: false,
        limit: 2,
      },
    ],
    pageParams: [1, 2],
  };
}

/**
 * The newest message the cache holds.
 *
 * Page 0 is the newest chunk and each page runs oldest first inside itself, so
 * the newest message overall is the last item of the first page -- not, as it
 * reads at a glance, the first item of the first page.
 */
function newestOf(cache: MessagePages | undefined) {
  const page = cache!.pages[0];

  return page.items[page.items.length - 1];
}

describe("insertIncomingMessage", () => {
  it("puts an arriving message at the newest end of the newest page", () => {
    const updated = insertIncomingMessage(conversation(), message("arrived", "2026-01-04"));

    const newestPage = updated!.pages[0];
    expect(newestPage.items[newestPage.items.length - 1].id).toBe("arrived");
  });

  it("does not bury an arriving message among the oldest", () => {
    const updated = insertIncomingMessage(conversation(), message("arrived", "2026-01-04"));

    const lastPage = updated!.pages[updated!.pages.length - 1];
    expect(lastPage.items.map((item) => item.id)).not.toContain("arrived");
  });

  it("keeps the conversation newest first", () => {
    const updated = insertIncomingMessage(conversation(), message("arrived", "2026-01-04"));

    expect(flattenConversation(updated).map((item) => item.id)).toEqual([
      "arrived",
      "newest",
      "middle",
      "oldest",
    ]);
  });

  it("ignores a message it has already stored", () => {
    const updated = insertIncomingMessage(conversation(), message("newest", "2026-01-03"));

    expect(flattenConversation(updated)).toHaveLength(3);
  });

  it("keeps no running total to fall out of step", () => {
    // Counting a conversation is a scan that grows with every message ever
    // sent, to produce a number nothing on screen displays -- and one that a
    // socket arrival or an optimistic send could push out of step with the
    // rows actually held. "Is there more" is the only question a scrolling
    // reader asks, and each page answers it for itself.
    const updated = insertIncomingMessage(conversation(), message("arrived", "2026-01-04"));

    expect(updated?.pages[0]).not.toHaveProperty("total");
  });

  it("leaves an unloaded conversation alone", () => {
    // Seeding a page here would let the query believe it had already fetched,
    // so the real history would never load.
    expect(insertIncomingMessage(undefined, message("arrived", "2026-01-04"))).toBeUndefined();
  });

  it("does not mutate the cache it was given", () => {
    const original = conversation();
    insertIncomingMessage(original, message("arrived", "2026-01-04"));

    expect(original.pages[0].items).toHaveLength(2);
  });
});

describe("flattenConversation", () => {
  it("orders newest first so an inverted list reads correctly", () => {
    // FlatList inverted renders index 0 at the bottom, and a conversation reads
    // with its newest message at the bottom.
    expect(flattenConversation(conversation()).map((item) => item.id)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
  });

  it("returns an empty list before anything has loaded", () => {
    expect(flattenConversation(undefined)).toEqual([]);
  });
});

describe("optimistic sending", () => {
  function pending(clientId: string) {
    return createPendingMessage({
      clientId,
      workspaceId: "w1",
      senderId: "u1",
      content: "hello",
    });
  }

  it("shows a sent message before the server confirms it", () => {
    const updated = insertPendingMessage(conversation(), pending("draft-1"));

    expect(newestOf(updated).content).toBe("hello");
  });

  // Without this the confirmation is treated as a new message and the sender
  // sees their own text twice.
  it("replaces the optimistic copy when the confirmation arrives", () => {
    const withPending = insertPendingMessage(conversation(), pending("draft-1"));

    const updated = insertIncomingMessage(withPending, {
      ...message("real-id", "2026-01-04"),
      client_id: "draft-1",
    });

    const contents = flattenConversation(updated).filter(
      (item) => item.content === "hello",
    );

    expect(contents).toHaveLength(0);
    expect(newestOf(updated).id).toBe("real-id");
  });

  // A row left marked "sending" after it has arrived never resolves, so the
  // message reads as stuck forever even though it was delivered.
  it("clears the sending state once confirmed", () => {
    const withPending = insertPendingMessage(conversation(), pending("draft-1"));

    const updated = insertIncomingMessage(withPending, {
      ...message("real-id", "2026-01-04"),
      client_id: "draft-1",
    });

    expect(newestOf(updated)).not.toHaveProperty("delivery");
    expect(newestOf(updated)).not.toHaveProperty("client_id");
  });

  // The confirmation takes the pending row's place rather than adding to it.
  it("does not leave both the pending and confirmed copies behind", () => {
    const withPending = insertPendingMessage(conversation(), pending("draft-1"));
    const before = flattenConversation(withPending).length;

    const updated = insertIncomingMessage(withPending, {
      ...message("real-id", "2026-01-04"),
      client_id: "draft-1",
    });

    expect(flattenConversation(updated)).toHaveLength(before);
  });

  // Two identical short replies are the ordinary case, not the exotic one.
  it("confirms the right copy when two messages have the same text", () => {
    let cache = insertPendingMessage(conversation(), pending("draft-1"));
    cache = insertPendingMessage(cache, pending("draft-2"));

    cache = insertIncomingMessage(cache, {
      ...message("real-2", "2026-01-04"),
      client_id: "draft-2",
    });

    const stillPending = flattenConversation(cache).filter(
      (item) => item.delivery === "sending",
    );

    expect(stillPending).toHaveLength(1);
    expect(stillPending[0].client_id).toBe("draft-1");
  });

  // Removing it would take the user's words off the screen, which is exactly
  // what this mechanism exists to prevent.
  it("keeps a failed message visible", () => {
    const withPending = insertPendingMessage(conversation(), pending("draft-1"));

    const updated = markMessageFailed(withPending, "draft-1");

    expect(newestOf(updated).content).toBe("hello");
    expect(newestOf(updated)).toHaveProperty("delivery", "failed");
  });

  it("removes a message so a retry can re-send it", () => {
    const withPending = insertPendingMessage(conversation(), pending("draft-1"));

    const updated = removePendingMessage(withPending, "draft-1");

    expect(flattenConversation(updated)).toHaveLength(3);
  });

  // Each send gets its own id, so a late confirmation of the first attempt
  // cannot resolve the retry and let both be delivered.
  it("gives every send a distinct correlation id", () => {
    const ids = new Set(
      Array.from({ length: 500 }, () => createClientId()),
    );

    expect(ids.size).toBe(500);
  });
});

// The correlation id is the primary mechanism, but it depends on the server
// echoing it back. When it does not -- an older deployment, or a message
// created through the REST endpoint rather than the socket -- the optimistic
// copy would otherwise sit marked "Sending..." until it was declared failed,
// telling the user a message was lost that had in fact been delivered.
describe("reconciling without a correlation id", () => {
  function pending(clientId: string, content = "hello") {
    return createPendingMessage({
      clientId,
      workspaceId: "w1",
      senderId: "u1",
      content,
    });
  }

  it("confirms an unacknowledged message by its content and sender", () => {
    const withPending = insertPendingMessage(conversation(), pending("draft-1"));

    const updated = insertIncomingMessage(withPending, {
      ...message("real-id", "2026-01-04"),
      content: "hello",
      sender_id: "u1",
    });

    const stillSending = flattenConversation(updated).filter(
      (item) => item.delivery === "sending",
    );

    expect(stillSending).toHaveLength(0);
    expect(newestOf(updated).id).toBe("real-id");
  });

  it("does not show the message twice when it falls back", () => {
    const withPending = insertPendingMessage(conversation(), pending("draft-1"));

    const updated = insertIncomingMessage(withPending, {
      ...message("real-id", "2026-01-04"),
      content: "hello",
      sender_id: "u1",
    });

    const copies = flattenConversation(updated).filter(
      (item) => item.content === "hello",
    );

    expect(copies).toHaveLength(1);
  });

  // Consuming the newest candidate would confirm the second message with the
  // first arrival and strand the one actually sent first.
  it("confirms identical messages in the order they were sent", () => {
    let cache = insertPendingMessage(conversation(), pending("draft-1"));
    cache = insertPendingMessage(cache, pending("draft-2"));

    cache = insertIncomingMessage(cache, {
      ...message("real-1", "2026-01-04"),
      content: "hello",
      sender_id: "u1",
    });

    const stillSending = flattenConversation(cache).filter(
      (item) => item.delivery === "sending",
    );

    expect(stillSending).toHaveLength(1);
    expect(stillSending[0].client_id).toBe("draft-2");
  });

  // Somebody else happening to send the same words must not silently swallow
  // the user's own unsent message.
  it("does not confirm against a message from another sender", () => {
    const withPending = insertPendingMessage(conversation(), pending("draft-1"));

    const updated = insertIncomingMessage(withPending, {
      ...message("real-id", "2026-01-04"),
      content: "hello",
      sender_id: "someone-else",
    });

    const stillSending = flattenConversation(updated).filter(
      (item) => item.delivery === "sending",
    );

    expect(stillSending).toHaveLength(1);
  });

  it("prefers the correlation id when the server supplies one", () => {
    let cache = insertPendingMessage(conversation(), pending("draft-1", "one"));
    cache = insertPendingMessage(cache, pending("draft-2", "two"));

    cache = insertIncomingMessage(cache, {
      ...message("real-2", "2026-01-04"),
      content: "two",
      sender_id: "u1",
      client_id: "draft-2",
    });

    const stillSending = flattenConversation(cache).filter(
      (item) => item.delivery === "sending",
    );

    expect(stillSending).toHaveLength(1);
    expect(stillSending[0].client_id).toBe("draft-1");
  });
});

describe("replaceMessage", () => {
  it("updates a message in place wherever it sits", () => {
    const updated = replaceMessage(conversation(), {
      ...message("oldest", "2026-01-01"),
      content: "corrected",
    });

    const found = flattenConversation(updated).find(
      (item) => item.id === "oldest",
    );

    expect(found?.content).toBe("corrected");
  });

  // Appending would show the message twice; discarding it as a duplicate would
  // keep displaying text the sender has already corrected.
  it("does not add a second copy of an edited message", () => {
    const before = flattenConversation(conversation()).length;

    const updated = replaceMessage(conversation(), {
      ...message("newest", "2026-01-03"),
      content: "corrected",
    });

    expect(flattenConversation(updated)).toHaveLength(before);
  });

  // The edit response has no per-reader fields, so overwriting outright would
  // silently mark a message the viewer had already read as unread.
  it("keeps fields the edit does not carry", () => {
    const cache = conversation();
    cache.pages[0].items[0] = {
      ...cache.pages[0].items[0],
      seen: true,
      seen_by_count: 4,
    };

    const updated = replaceMessage(cache, {
      id: "newest",
      workspace_id: "w1",
      sender_id: "u1",
      content: "corrected",
      created_at: "2026-01-03",
    } as never);

    expect(updated?.pages[0].items[0].seen_by_count).toBe(4);
  });

  it("leaves a conversation alone when the message is not in it", () => {
    const updated = replaceMessage(conversation(), {
      ...message("not-loaded", "2026-01-09"),
      content: "corrected",
    });

    expect(flattenConversation(updated).map((item) => item.id)).not.toContain(
      "not-loaded",
    );
  });
});
