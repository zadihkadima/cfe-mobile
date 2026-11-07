import { render, screen } from "@testing-library/react-native";

import { HistoryList } from "../HistoryList";
import { HistoryEntry } from "../../api/api";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    action: "PATCH /api/v1/workspaces/:id",
    method: "PATCH",
    path: "/api/v1/workspaces/abc",
    status: 200,
    outcome: "success",
    duration_ms: 12,
    created_at: new Date("2026-01-05T09:30:00Z").toISOString(),
    ...overrides,
  };
}

it("distinguishes no activity from a failed load", async () => {
  await render(<HistoryList entries={[]} />);

  // An empty panel with no words is how an investigator concludes nothing
  // happened when in fact nothing loaded.
  expect(screen.getByText(/no recorded activity/i)).toBeTruthy();
});

it("reads the action as a sentence rather than a route template", async () => {
  await render(<HistoryList entries={[entry()]} />);

  expect(screen.getByText("Updated workspace")).toBeTruthy();

  // This test previously asserted the opposite, and was passing. The row read
  // "Updated /api/v1/workspaces/:id", which is the route template with a verb
  // in front of it -- a description of the API rather than of anything a
  // person did.
  expect(screen.queryByText(/:id/)).toBeNull();
  expect(screen.queryByText(/api\/v1/)).toBeNull();
});

it("offers a way to the place the action happened", async () => {
  await render(
    <HistoryList
      entries={[
        entry({
          action: "POST /api/v1/workspaces/:id/tasks",
          method: "POST",
          workspace_id: "ws-1",
          resource: { id: "ws-1" },
        }),
      ]}
    />,
  );

  // Knowing a task was created is half an answer. The other half is being able
  // to go and look at it without first working out which workspace it was in.
  expect(screen.getByLabelText("Created task. Open where this happened.")).toBeTruthy();
});

it("does not offer a link for activity that happened at no record", async () => {
  await render(
    <HistoryList entries={[entry({ action: "POST /api/v1/auth/login", method: "POST" })]} />,
  );

  expect(screen.getByText("Signed in")).toBeTruthy();
  expect(screen.queryByLabelText(/Open where this happened/)).toBeNull();
});

it("names outcomes in words, not status codes", async () => {
  await render(<HistoryList entries={[entry({ outcome: "denied", status: 403 })]} />);

  // "403" tells an administrator nothing at a glance, and "Denied" is the
  // thing they are scanning the column for.
  expect(screen.getByText("Denied")).toBeTruthy();
  expect(screen.queryByText("403")).toBeNull();
});

it("shows the role asserted at the time of the action", async () => {
  await render(<HistoryList entries={[entry({ actor_role: "manager" })]} />);

  // Roles change; the question is always what authority they held then.
  expect(screen.getByText(/manager/)).toBeTruthy();
});

it("renders entries that share a timestamp without collapsing them", async () => {
  await render(
    <HistoryList
      entries={[
        entry({ request_id: "r1", method: "POST" }),
        entry({ request_id: "r2", method: "DELETE" }),
      ]}
    />
  );

  expect(screen.getByText(/^Created/)).toBeTruthy();
  expect(screen.getByText(/^Deleted/)).toBeTruthy();
});
