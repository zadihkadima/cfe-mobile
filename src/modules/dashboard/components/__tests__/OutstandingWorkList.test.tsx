import { render, fireEvent, screen } from "@testing-library/react-native";

import { OutstandingWorkList } from "../OutstandingWorkList";
import { OutstandingItem } from "../../api/types";

// Named with the `mock` prefix because jest.mock factories are hoisted above
// the file body and may only reach variables it can prove are initialised.
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function item(overrides: Partial<OutstandingItem> = {}): OutstandingItem {
  return {
    id: "item-1",
    kind: "task",
    workspace_id: "ws-1",
    title: "Review return",
    status: "open",
    assigned_to_me: false,
    ...overrides,
  };
}

function isoIn(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

beforeEach(() => {
  mockPush.mockClear();
});

it("says so plainly when there is nothing outstanding", async () => {
  await render(<OutstandingWorkList items={[]} role="client" />);

  // An empty list with no message is indistinguishable from one that failed
  // to load, and the reader cannot tell whether to wait or to get on with
  // their day.
  expect(screen.getByText(/all caught up/i)).toBeTruthy();
});

it("names the kind of each row so a signature is not mistaken for a task", async () => {
  await render(
    <OutstandingWorkList
      items={[
        item({ id: "a", kind: "signature_request", title: "Form 8879" }),
        item({ id: "b", kind: "file_request", title: "Upload W-2" }),
      ]}
      role="client"
    />
  );

  expect(screen.getByText("Signature")).toBeTruthy();
  expect(screen.getByText("File Request")).toBeTruthy();
});

it("calls out late work in words, not only in colour", async () => {
  await render(<OutstandingWorkList items={[item({ due_at: isoIn(-3) })]} role="client" />);

  // Colour alone is invisible to a colour-blind reader, and this is the one
  // signal on the screen that carries a deadline.
  expect(screen.getByText(/overdue/i)).toBeTruthy();
});

it("does not mark completed work overdue however late it was finished", async () => {
  await render(
    <OutstandingWorkList items={[item({ due_at: isoIn(-30), status: "completed" })]} role="client" />
  );

  expect(screen.queryByText(/overdue/i)).toBeNull();
});

it("opens the workspace route belonging to the reader's role", async () => {
  await render(<OutstandingWorkList items={[item()]} role="client" />);

  await fireEvent.press(screen.getByText("Review return"));

  // The admin tree is a separate set of routes. Sending a client there gives
  // them a screen their guard will bounce them out of.
  expect(mockPush).toHaveBeenCalledWith("/user/workspaces/ws-1");
});

it("opens the admin workspace route for an administrator", async () => {
  await render(<OutstandingWorkList items={[item()]} role="admin" />);

  await fireEvent.press(screen.getByText("Review return"));

  expect(mockPush).toHaveBeenCalledWith("/user/admin/workspaces/ws-1");
});
