import { fireEvent, render, screen } from "@testing-library/react-native";

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

const withParent = message({
  reply_to_id: "p1",
  reply_to: {
    id: "p1",
    sender_id: "u2",
    sender_name: "Ada Lovelace",
    content: "the original message",
  },
});

describe("jumping to a quoted message", () => {
  it("opens the original when the excerpt is tapped", async () => {
    const onOpenParent = jest.fn();

    await render(
      <MessageBubble
        message={withParent}
        workspaceId="w1"
        isOwn={false}
        onOpenParent={onOpenParent}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: /Replying to/ }));

    expect(onOpenParent).toHaveBeenCalledWith("p1");
  });

  // The excerpt is truncated, so the affordance has to say there is more
  // behind it; otherwise a shortened quote reads as the whole of what was said.
  it("tells a screen reader the quote can be opened", async () => {
    await render(
      <MessageBubble message={withParent} workspaceId="w1" isOwn={false} />,
    );

    expect(
      screen.getByLabelText(/Replying to Ada Lovelace.*double tap to show it/),
    ).toBeTruthy();
  });
});
