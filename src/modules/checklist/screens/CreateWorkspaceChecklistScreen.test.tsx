import { renderScreen } from "@/test-utils/renderScreen";
import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import { CreateWorkspaceChecklistScreen } from "./CreateWorkspaceChecklistScreen";
import { api } from "@/core/api/client";

const mockBack = jest.fn();

/**
 * Dates the stub picker will report, oldest call first. Declared out here
 * because `jest.mock` is hoisted above every other statement in the file and
 * can only close over names visible at that point.
 */
const mockPickerQueue: Date[] = [];

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  usePathname: () => "/user/workspaces/ws-1/checklists-create",
}));

jest.mock("@/core/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

jest.mock("@/core/auth/tokenService", () => ({
  tokenService: { getAccessToken: () => "test-token" },
}));

/**
 * Stands in for the native picker, which renders no driveable surface.
 *
 * It reports whatever the test queued rather than a fixed date, because the
 * interesting cases are about the *relationship* between two dates and a stub
 * that always returns the same day cannot express one.
 */
jest.mock("@react-native-community/datetimepicker", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  const React = jest.requireActual("react");

  return {
    __esModule: true,
    default: ({ onChange }: { onChange: (e: { type: string }, d?: Date) => void }) =>
      React.createElement(
        Pressable,
        {
          testID: "mock-picker",
          onPress: () => onChange({ type: "set" }, mockPickerQueue.shift() ?? new Date()),
        },
        React.createElement(Text, null, "pick"),
      ),
  };
});

const post = api.post as jest.Mock;

/**
 * Opens a date field, lets the stub picker report the next queued date, and
 * dismisses it.
 *
 * The dismissal matters: under jest-expo the platform is iOS, where the picker
 * stays on screen until Done is pressed. Leaving it open means the next field
 * opened has a second picker mounted alongside it and the query for one finds
 * two.
 */
async function pickDate(label: string, date: Date) {
  mockPickerQueue.push(date);

  await fireEvent.press(await screen.findByLabelText(new RegExp(`^${label}\\.`)));
  await fireEvent.press(await screen.findByTestId("mock-picker"));

  const done = screen.queryByText("Done");

  if (done) {
    await fireEvent.press(done);
  }
}

describe("CreateWorkspaceChecklistScreen", () => {
  beforeEach(() => {
    post.mockReset();
    mockBack.mockClear();
    mockPickerQueue.length = 0;
    post.mockResolvedValue({ data: {} });
  });

  it("sends the picked date as an instant the API can parse", async () => {
    await renderScreen(<CreateWorkspaceChecklistScreen workspaceId="ws-1" />);

    await fireEvent.changeText(screen.getByPlaceholderText("Checklist title"), "Q1 filing");

    await pickDate("Start date", new Date(2026, 2, 15, 12));

    await fireEvent.press(screen.getByText("Save checklist"));

    await waitFor(() => {
      expect(post).toHaveBeenCalledTimes(1);
    });

    // The screen holds YYYY-MM-DD but the endpoint parses RFC3339, so sending
    // the field verbatim would be rejected and the checklist saved undated.
    const body = post.mock.calls[0][1] as { start_at: string | null };

    expect(body.start_at).toMatch(/^2026-03-15T/);
  });

  it("keeps the day that was tapped regardless of the reader's timezone", async () => {
    await renderScreen(<CreateWorkspaceChecklistScreen workspaceId="ws-1" />);

    await fireEvent.changeText(screen.getByPlaceholderText("Checklist title"), "Q1 filing");

    await pickDate("Due date", new Date(2026, 2, 15, 12));

    await fireEvent.press(screen.getByText("Save checklist"));

    await waitFor(() => {
      expect(post).toHaveBeenCalledTimes(1);
    });

    // Stored at midnight UTC this reads as the 14th to anyone west of
    // Greenwich, so a deadline would move a day depending on who opened it.
    const body = post.mock.calls[0][1] as { due_at: string };

    expect(new Date(body.due_at).getUTCHours()).toBe(12);
  });

  it("omits dates that were never picked rather than inventing them", async () => {
    await renderScreen(<CreateWorkspaceChecklistScreen workspaceId="ws-1" />);

    await fireEvent.changeText(screen.getByPlaceholderText("Checklist title"), "Q1 filing");
    await fireEvent.press(screen.getByText("Save checklist"));

    await waitFor(() => {
      expect(post).toHaveBeenCalledTimes(1);
    });

    const body = post.mock.calls[0][1] as {
      start_at: string | null;
      due_at: string | null;
    };

    expect(body.start_at).toBeNull();
    expect(body.due_at).toBeNull();
  });

  it("refuses to save a checklist due before it starts", async () => {
    await renderScreen(<CreateWorkspaceChecklistScreen workspaceId="ws-1" />);

    await fireEvent.changeText(screen.getByPlaceholderText("Checklist title"), "Q1 filing");

    // The due date is chosen first and the start is then pushed past it. The
    // picker's minimumDate cannot catch this ordering, which is precisely why
    // the submit-time check has to exist as well.
    await pickDate("Due date", new Date(2026, 2, 1, 12));
    await pickDate("Start date", new Date(2026, 2, 15, 12));

    await fireEvent.press(screen.getByText("Save checklist"));

    expect(await screen.findByText(/cannot be before the start date/i)).toBeTruthy();

    // The point is that nothing was sent. A server-side rejection would also
    // block it, but only after a round trip that names neither field.
    expect(post).not.toHaveBeenCalled();
  });

  it("keeps the save disabled until the checklist has a title", async () => {
    await renderScreen(<CreateWorkspaceChecklistScreen workspaceId="ws-1" />);

    await fireEvent.press(screen.getByText("Save checklist"));

    expect(post).not.toHaveBeenCalled();
  });
});
