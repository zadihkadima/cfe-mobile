import { render } from "@testing-library/react-native";

import { ConversationMessage } from "../api/conversation";

import { MessageBubble } from "./MessageBubble";

function message(
  overrides: Partial<ConversationMessage> = {},
): ConversationMessage {
  return {
    id: "m1",
    workspace_id: "w1",
    sender_id: "u1",
    content: "hello",
    is_broadcast: false,
    seen: false,
    seen_by_count: 1,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * The alignment is read off the rendered node rather than a snapshot so that
 * the assertion says which side the bubble is on, which is the thing that was
 * reported as wrong.
 */
function rowClassName(tree: Awaited<ReturnType<typeof render>>) {
  const root = tree.toJSON();
  const node = Array.isArray(root) ? root[0] : root;

  return String(node?.props?.className ?? "");
}

describe("MessageBubble", () => {
  describe("sender attribution", () => {
    it("names the sender of an incoming message", async () => {
      // A workspace conversation has several managers and administrators in
      // it, so an unattributed bubble does not say who is speaking.
      const tree = await render(
        <MessageBubble
          message={message({ sender_name: "Ada Lovelace" })}
          workspaceId="w1"
          isOwn={false}
          showSender
        />,
      );

      expect(tree.getByText("Ada Lovelace")).toBeTruthy();
    });

    it("does not repeat the name within a run from one sender", async () => {
      // The list clears showSender for the rest of a run. Repeating it turns a
      // conversation into a column of the same name.
      const tree = await render(
        <MessageBubble
          message={message({ sender_name: "Ada Lovelace" })}
          workspaceId="w1"
          isOwn={false}
          showSender={false}
        />,
      );

      expect(tree.queryByText("Ada Lovelace")).toBeNull();
    });

    it("never labels the reader's own message", async () => {
      // Which side of the screen it sits on has already said so.
      const tree = await render(
        <MessageBubble
          message={message({ sender_name: "Ada Lovelace" })}
          workspaceId="w1"
          isOwn
          showSender
        />,
      );

      expect(tree.queryByText("Ada Lovelace")).toBeNull();
    });

    it("announces the sender to a screen reader on every message", async () => {
      // The grouping that makes the repeated name redundant is visual, and a
      // screen reader moves through the conversation one message at a time.
      const tree = await render(
        <MessageBubble
          message={message({ sender_name: "Ada Lovelace" })}
          workspaceId="w1"
          isOwn={false}
          showSender={false}
        />,
      );

      expect(tree.getByLabelText(/^Ada Lovelace, hello/)).toBeTruthy();
    });

    it("renders a message the server could not name", async () => {
      // sender_name is best-effort on the server, so its absence must not cost
      // the reader the message itself.
      const tree = await render(
        <MessageBubble message={message()} workspaceId="w1" isOwn={false} showSender />,
      );

      expect(tree.getByText("hello")).toBeTruthy();
    });
  });

  it("puts the reader's own message on the right", async () => {
    const tree = await render(
      <MessageBubble message={message()} workspaceId="w1" isOwn />,
    );

    expect(rowClassName(tree)).toContain("flex-row");
    expect(rowClassName(tree)).toContain("justify-end");
    expect(rowClassName(tree)).not.toContain("justify-start");
  });

  it("puts a message from someone else on the left", async () => {
    const tree = await render(
      <MessageBubble message={message()} workspaceId="w1" isOwn={false} />,
    );

    expect(rowClassName(tree)).toContain("flex-row");
    expect(rowClassName(tree)).toContain("justify-start");
    expect(rowClassName(tree)).not.toContain("justify-end");
  });

  it("shows a reply summary when present", async () => {
    const tree = await render(
      <MessageBubble
        message={message({ reply_to_id: "p1", reply_to: { id: "p1", sender_id: "u2", sender_name: "Eve", content: "parent message" } })}
        workspaceId="w1"
        isOwn={false}
      />,
    );

    expect(tree.getByText("Eve")).toBeTruthy();
    expect(tree.getByText("parent message")).toBeTruthy();
  });
});
