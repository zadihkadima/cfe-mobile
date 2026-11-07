import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import { renderScreen } from "@/test-utils/renderScreen";
import { api } from "@/core/api/client";

import { CreateWorkspaceTaskScreen } from "./CreateWorkspaceTaskScreen";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  usePathname: () => "/user/admin/workspaces/ws-1/tasks/new",
}));

jest.mock("@/core/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;

beforeEach(() => {
  mockBack.mockClear();
  get.mockReset();
  post.mockReset();

  get.mockResolvedValue({
    data: {
      items: [{ id: "m-1", first_name: "Dana", last_name: "Reyes", role: "manager" }],
    },
  });

  post.mockResolvedValue({ data: {} });
});

/** Fills the three fields the save button is gated on. */
async function fillRequired() {
  await fireEvent.changeText(screen.getByPlaceholderText("Task title"), "File Q3 return");
  await fireEvent.changeText(screen.getByPlaceholderText("Client email"), "dana@acme.test");
  await fireEvent.changeText(
    screen.getByPlaceholderText("Associated manager email"),
    "sam@firm.test"
  );
}

function body(): Record<string, unknown> {
  return post.mock.calls[0][1] as Record<string, unknown>;
}

describe("CreateWorkspaceTaskScreen", () => {
  it("will not submit without the fields the API requires", async () => {
    await renderScreen(<CreateWorkspaceTaskScreen workspaceId="ws-1" />);

    await fireEvent.press(screen.getByText("Save task"));

    // Submitting anyway would spend a round trip to be told what the screen
    // already knew, and the user would read the failure as a server problem.
    expect(post).not.toHaveBeenCalled();
  });

  it("posts the task to the workspace it was opened from", async () => {
    await renderScreen(<CreateWorkspaceTaskScreen workspaceId="ws-1" />);

    await fillRequired();
    await fireEvent.press(screen.getByText("Save task"));

    await waitFor(() => expect(post).toHaveBeenCalled());

    expect(post.mock.calls[0][0]).toBe("/workspaces/ws-1/tasks");
    expect(body().title).toBe("File Q3 return");
  });

  it("sends an unassigned task as null rather than an empty string", async () => {
    await renderScreen(<CreateWorkspaceTaskScreen workspaceId="ws-1" />);

    await fillRequired();
    await fireEvent.press(screen.getByText("Save task"));

    await waitFor(() => expect(post).toHaveBeenCalled());

    // An empty string is a value; the API would try to resolve it as a user id.
    expect(body().assigned_to).toBeNull();
  });

  it("trims the addresses before sending them", async () => {
    await renderScreen(<CreateWorkspaceTaskScreen workspaceId="ws-1" />);

    await fireEvent.changeText(screen.getByPlaceholderText("Task title"), "File Q3 return");
    await fireEvent.changeText(screen.getByPlaceholderText("Client email"), "  dana@acme.test ");
    await fireEvent.changeText(
      screen.getByPlaceholderText("Associated manager email"),
      " sam@firm.test  "
    );

    await fireEvent.press(screen.getByText("Save task"));

    await waitFor(() => expect(post).toHaveBeenCalled());

    // A leading space is invisible on screen and silently fails to match any
    // account, so the task is raised against nobody.
    expect(body().client_email).toBe("dana@acme.test");
    expect(body().manager_email).toBe("sam@firm.test");
  });

  it("returns to the list once the task is saved", async () => {
    await renderScreen(<CreateWorkspaceTaskScreen workspaceId="ws-1" />);

    await fillRequired();
    await fireEvent.press(screen.getByText("Save task"));

    // Staying put is how a task gets raised twice.
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it("stays on the screen when saving fails", async () => {
    post.mockRejectedValue(new Error("network"));

    await renderScreen(<CreateWorkspaceTaskScreen workspaceId="ws-1" />);

    await fillRequired();
    await fireEvent.press(screen.getByText("Save task"));

    await waitFor(() => expect(post).toHaveBeenCalled());

    // Navigating back on failure would discard the typed work and report
    // success for a task that was never created.
    expect(mockBack).not.toHaveBeenCalled();
  });
});
