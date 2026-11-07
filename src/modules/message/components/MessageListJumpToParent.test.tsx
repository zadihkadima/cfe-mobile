import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { ConversationMessage } from "../api/conversation";

import { MessageList } from "./MessageList";

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
    created_at: new Date("2026-08-03T10:00:00Z").toISOString(),
    ...overrides,
  };
}

/** A reply whose original is not among the loaded messages. */
const replyToSomethingOffPage = message({
  id: "m2",
  reply_to_id: "far-back",
  reply_to: {
    id: "far-back",
    sender_id: "u2",
    sender_name: "Ada Lovelace",
    content: "said long ago",
  },
});

/** A reply whose original is loaded and sitting right there. */
const replyToSomethingLoaded = message({
  id: "m3",
  reply_to_id: "nearby",
  reply_to: {
    id: "nearby",
    sender_id: "u2",
    sender_name: "Ada Lovelace",
    content: "said a moment ago",
  },
});

type ListProps = React.ComponentProps<typeof MessageList>;

function listProps(overrides: Partial<ListProps> = {}): ListProps {
  return {
    messages: [replyToSomethingOffPage],
    currentUserId: "u1",
    workspaceId: "w1",
    onLoadMore: jest.fn(),
    canLoadMore: true,
    ...overrides,
  };
}

async function pressTheQuote() {
  await fireEvent.press(screen.getByRole("button", { name: /Replying to/ }));
}

describe("jumping to a quoted message that is not loaded", () => {
  // The excerpt is truncated on purpose, so tapping it is the only way to read
  // the whole of what was said. Doing nothing at all makes the affordance a
  // lie.
  it("asks for a window built around the original", async () => {
    const onAnchorTo = jest.fn().mockResolvedValue(true);

    await render(<MessageList {...listProps({ onAnchorTo })} />);

    await pressTheQuote();

    await waitFor(() => expect(onAnchorTo).toHaveBeenCalledWith("far-back"));
  });

  // This is the whole point of anchoring. The previous implementation walked
  // backwards one page at a time, up to ten, which meant a reply quoting
  // something from months ago cost twenty round trips or silently did nothing.
  it("does not page backwards through the history to find it", async () => {
    const onLoadMore = jest.fn();
    const onAnchorTo = jest.fn().mockResolvedValue(true);

    await render(<MessageList {...listProps({ onLoadMore, onAnchorTo })} />);

    await pressTheQuote();

    await waitFor(() => expect(onAnchorTo).toHaveBeenCalled());

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  // A message already on screen needs no request at all -- the list just
  // scrolls to it. Re-anchoring would throw away every other loaded page to
  // fetch something it already had.
  it("does not re-anchor for a message that is already loaded", async () => {
    const onAnchorTo = jest.fn().mockResolvedValue(true);

    await render(
      <MessageList
        {...listProps({
          onAnchorTo,
          messages: [
            replyToSomethingLoaded,
            message({ id: "nearby", content: "said a moment ago" }),
          ],
        })}
      />,
    );

    await pressTheQuote();

    expect(onAnchorTo).not.toHaveBeenCalled();
  });

  // Without a handler there is nowhere to send the request, and the tap has to
  // be a no-op rather than a crash.
  it("does nothing when there is no way to anchor", async () => {
    await render(<MessageList {...listProps({ onAnchorTo: undefined })} />);

    await expect(pressTheQuote()).resolves.not.toThrow();
  });
});

describe("returning to the live end", () => {
  // A reader who followed a reply into old history has no other way back:
  // scrolling down page by page could be months of them.
  it("offers a way back once the window has come away from the newest", async () => {
    await render(
      <MessageList
        {...listProps({ atLatest: false, onReturnToLatest: jest.fn() })}
      />,
    );

    expect(screen.getByRole("button", { name: /Jump to latest/ })).toBeTruthy();
  });

  // At the live end it would sit over the conversation saying nothing useful.
  it("hides it while the newest message is loaded", async () => {
    await render(
      <MessageList
        {...listProps({ atLatest: true, onReturnToLatest: jest.fn() })}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Jump to latest/ }),
    ).toBeNull();
  });

  it("returns to the newest messages when it is pressed", async () => {
    const onReturnToLatest = jest.fn();

    await render(
      <MessageList {...listProps({ atLatest: false, onReturnToLatest })} />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: /Jump to latest/ }),
    );

    expect(onReturnToLatest).toHaveBeenCalled();
  });
});
