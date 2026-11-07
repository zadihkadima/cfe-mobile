import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { renderScreen } from "@/test-utils/renderScreen";
import { api } from "@/core/api/client";

import { WorkspaceListScreen } from "./WorkspaceListScreen";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/user/admin/workspaces",
}));

jest.mock("@/core/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const get = api.get as jest.Mock;

beforeEach(() => {
  get.mockReset();

  get.mockResolvedValue({
    data: {
      items: [{ id: "ws-1", name: "Acme Holdings 2025" }],
      total: 1,
      total_pages: 1,
    },
  });
});

function signedInAs(role: "admin" | "manager" | "client") {
  return {
    preloadedState: {
      auth: { user: { id: "u-1", email: "u@acme.test", role }, hydrated: true },
    },
  };
}

describe("WorkspaceListScreen", () => {
  it("offers an administrator a way to create a workspace", async () => {
    await renderScreen(<WorkspaceListScreen />, signedInAs("admin"));

    await screen.findByText("Acme Holdings 2025");

    // The floating action is the only route to workspace creation from here.
    // If it stops rendering, the feature is unreachable without deep-linking.
    expect(screen.getByLabelText("Create workspace")).toBeTruthy();
  });

  it.each(["manager", "client"] as const)(
    "does not offer workspace creation to a %s",
    async (role) => {
      await renderScreen(<WorkspaceListScreen />, signedInAs(role));

      await screen.findByText("Acme Holdings 2025");

      // POST /workspaces is admin-only, so the button would lead to a form the
      // API refuses.
      expect(screen.queryByLabelText("Create workspace")).toBeNull();
    }
  );

  it("renders a workspace that has no managers assigned", async () => {
    get.mockResolvedValue({
      data: {
        items: [{ id: "ws-1", name: "Acme Holdings 2025", manager_ids: null }],
        total: 1,
        total_pages: 1,
      },
    });

    await renderScreen(<WorkspaceListScreen />, signedInAs("admin"));

    // A nil slice in Go marshals to JSON null, so this is what the API sent
    // for a workspace with nobody on it. Reading `.length` off it threw while
    // rendering the row, which unmounted the whole list -- the screen went
    // blank and took the create button with it, which looks exactly like the
    // feature having been removed.
    expect(await screen.findByText("Acme Holdings 2025")).toBeTruthy();
    expect(screen.getByLabelText("Create workspace")).toBeTruthy();
  });
});

/** The status parameter of each list request, in order. */
const statusParams = () =>
  get.mock.calls
    .filter(([url]: [string]) => url === "/workspaces")
    .map(([, config]: [string, { params?: { status?: string } }]) => config?.params?.status);

describe("WorkspaceListScreen, filtering by status", () => {
  // Opening on a filter the reader did not choose means the first thing the
  // screen does is hide work from them, and a completed engagement they were
  // looking for reads as missing rather than as filtered.
  it("shows every status until one is chosen", async () => {
    await renderScreen(<WorkspaceListScreen />, signedInAs("admin"));

    await screen.findByText("Acme Holdings 2025");

    expect(statusParams().every((status) => status === undefined)).toBe(true);
  });

  it("narrows to the chosen status", async () => {
    await renderScreen(<WorkspaceListScreen />, signedInAs("admin"));

    await screen.findByText("Acme Holdings 2025");

    await fireEvent.press(screen.getByLabelText("Completed"));

    // Sent to the server rather than filtered on this side, so the totals and
    // the page count describe the filtered set. Filtered here, the pager would
    // be counting pages of a list the reader cannot see.
    await waitFor(() => expect(statusParams()).toContain("completed"));
  });

  it("names the filter when the filter is what emptied the list", async () => {
    get.mockResolvedValue({ data: { items: [], total: 0, total_pages: 0 } });

    await renderScreen(<WorkspaceListScreen />, signedInAs("admin"));

    await fireEvent.press(screen.getByLabelText("Cancelled"));

    // Otherwise the reader concludes the firm has no work at all and goes
    // looking for a fault.
    await waitFor(() => expect(screen.getByText("No cancelled workspaces")).toBeTruthy());
  });

  it("does not badge the state most workspaces are in", async () => {
    await renderScreen(<WorkspaceListScreen />, signedInAs("admin"));

    await screen.findByText("Acme Holdings 2025");

    // Counted rather than asserted absent, because the filter tab carries the
    // same word. One occurrence is the tab; a second would be a badge on the
    // row. A badge on nearly every row stops being read, and takes the badge
    // that does mean something down with it.
    expect(screen.getAllByText("Ongoing")).toHaveLength(1);
  });

  it("badges a workspace that is not ongoing", async () => {
    get.mockResolvedValue({
      data: {
        items: [{ id: "ws-1", name: "Acme Holdings 2025", status: "unfinished-halted" }],
        total: 1,
        total_pages: 1,
      },
    });

    await renderScreen(<WorkspaceListScreen />, signedInAs("admin"));

    await screen.findByText("Acme Holdings 2025");

    // Two: the filter tab and the badge on the row. "On hold", not
    // "Unfinished halted" -- the stored value is not a phrase anybody says.
    expect(screen.getAllByText("On hold")).toHaveLength(2);
  });
});
