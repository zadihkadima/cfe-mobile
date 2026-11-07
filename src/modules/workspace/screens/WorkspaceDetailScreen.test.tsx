import { renderScreen } from "@/test-utils/renderScreen";
import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import { WorkspaceDetailScreen } from "./WorkspaceDetailScreen";
import { api } from "@/core/api/client";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  router: { push: mockPush, replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: "ws-1" }),
  usePathname: () => "/user/admin/workspaces/ws-1",
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/core/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

jest.mock("@/core/auth/tokenService", () => ({
  tokenService: { getAccessToken: () => "test-token" },
}));

const get = api.get as jest.Mock;

/**
 * Routes each module's list request to an empty result so every tab reaches its
 * rendered state rather than sitting on a skeleton. The assertions here are
 * about which module is mounted, not about what data it shows.
 */
function stubEndpoints() {
  get.mockImplementation((url: string) => {
    if (url === "/workspaces/ws-1") {
      return Promise.resolve({
        data: {
          id: "ws-1",
          name: "Acme Holdings 2025",
          description: "2025 tax preparation",
          client_id: "c-1",
          manager_ids: ["m-1"],
          created_at: "2025-01-15T00:00:00.000Z",
        },
      });
    }

    if (url.includes("client-details")) {
      return Promise.resolve({
        data: { first_name: "Dana", last_name: "Reyes", email: "dana@acme.test" },
      });
    }

    if (url.includes("/members")) {
      return Promise.resolve({
        data: {
          items: [
            {
              id: "m-1",
              first_name: "Morgan",
              last_name: "Lee",
              email: "morgan@acme.test",
              role: "manager",
            },
          ],
          total: 1,
        },
      });
    }

    return Promise.resolve({ data: { items: [], total: 0 } });
  });
}

describe("WorkspaceDetailScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    get.mockReset();
    stubEndpoints();
  });

  it("shows the workspace name compactly with the client beneath it", async () => {
    await renderScreen(<WorkspaceDetailScreen />);

    expect(await screen.findByText("Acme Holdings 2025")).toBeTruthy();

    // Appears twice on load, and deliberately so: once in the persistent header
    // and once inside the Details tab that opens by default. The header
    // copy is what keeps the client identified after switching to Tasks or
    // Messages, where nothing else on screen names them.
    await waitFor(() => expect(screen.getAllByText("Dana Reyes").length).toBeGreaterThan(0));
  });

  it("opens with workspace metadata and assignments", async () => {
    await renderScreen(<WorkspaceDetailScreen />);

    expect(await screen.findByText("Workspace details")).toBeTruthy();
    expect(screen.getByText("2025 tax preparation")).toBeTruthy();
    expect(screen.getByText("Assigned client")).toBeTruthy();
    expect(screen.getByText("Assigned managers")).toBeTruthy();
    expect(await screen.findByText("Morgan Lee")).toBeTruthy();
    expect(screen.getByText("morgan@acme.test")).toBeTruthy();
  });

  /**
   * The regression this screen exists to prevent.
   *
   * Selecting a tab used to render a card describing the module plus an
   * "Open Tasks" button that navigated away. Asserting the absence of that
   * button is what stops the dead-end pattern being reintroduced.
   */
  it("renders module content inline instead of a link to another page", async () => {
    await renderScreen(<WorkspaceDetailScreen />);

    await screen.findByText("Acme Holdings 2025");
    await fireEvent.press(screen.getByText("Tasks"));

    // The module itself is mounted: its empty state belongs to the tasks list.
    expect(await screen.findByText("No tasks yet.")).toBeTruthy();

    expect(screen.queryByText(/^Open /)).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("switches modules without navigating", async () => {
    await renderScreen(<WorkspaceDetailScreen />);

    await screen.findByText("Acme Holdings 2025");

    await fireEvent.press(screen.getByText("Tasks"));
    expect(await screen.findByText("No tasks yet.")).toBeTruthy();

    await fireEvent.press(screen.getByText("Checklists"));
    await waitFor(() => expect(screen.queryByText("No tasks yet.")).toBeNull());

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("marks the selected tab as selected for assistive technology", async () => {
    await renderScreen(<WorkspaceDetailScreen />);

    await screen.findByText("Acme Holdings 2025");

    // Details is the default, so the screen opens on the workspace's assigned
    // people and metadata rather than on one module's narrower view.
    const [detailsTab] = screen.getAllByRole("tab", { name: "Details" });
    expect(detailsTab.props.accessibilityState.selected).toBe(true);

    await fireEvent.press(screen.getByText("Tasks"));

    const [tasksTab] = screen.getAllByRole("tab", { name: "Tasks" });
    await waitFor(() => expect(tasksTab.props.accessibilityState.selected).toBe(true));
  });

  it("surfaces a retry when the workspace fails to load", async () => {
    get.mockRejectedValue(new Error("network"));

    await renderScreen(<WorkspaceDetailScreen />);

    await waitFor(() => expect(screen.queryByText("Acme Holdings 2025")).toBeNull());
  });

  /**
   * This screen is now the workspace shell for all three roles.
   *
   * It used to be rendered only by the admin route, while clients and managers
   * got an older page of nine cards that each navigated away. Sharing it fixed
   * that, but it also means every affordance on it is now offered to people the
   * API may refuse — so the role gating below is the thing that makes sharing
   * it safe, and it is asserted per role rather than once.
   */
  describe("editing", () => {
    function signedInAs(role: "admin" | "manager" | "client") {
      return {
        preloadedState: {
          auth: {
            user: { id: "u-1", email: "u@acme.test", role },
            hydrated: true,
          },
        },
      };
    }

    it("offers editing to an administrator", async () => {
      await renderScreen(<WorkspaceDetailScreen />, signedInAs("admin"));

      await screen.findByText("Acme Holdings 2025");

      expect(screen.getByLabelText("Edit workspace")).toBeTruthy();
    });

    it.each(["manager", "client"] as const)(
      "does not offer editing to a %s, who the API would refuse",
      async (role) => {
        await renderScreen(<WorkspaceDetailScreen />, signedInAs(role));

        await screen.findByText("Acme Holdings 2025");

        // PATCH /workspaces/:id sits behind RequireRole("admin"). Showing the
        // control anyway means the first a manager learns of the restriction
        // is a 403 after filling in the form, with their edits lost.
        expect(screen.queryByLabelText("Edit workspace")).toBeNull();
      }
    );

    it("does not offer editing before the session has been read", async () => {
      // On a cold start the store is empty for a moment. Defaulting to
      // "offer it" would flash the control at everyone.
      await renderScreen(<WorkspaceDetailScreen />);

      await screen.findByText("Acme Holdings 2025");

      expect(screen.queryByLabelText("Edit workspace")).toBeNull();
    });
  });

  describe("unread badges", () => {
    /**
     * A signed-in session, which these tests need and the ones above do not.
     *
     * Unread counts are per-person, so the hooks behind these badges refuse to
     * fetch until the session has been read back and somebody is signed in --
     * otherwise a cold start fires two requests that can only 401, and the
     * answer would belong to nobody in particular. Rendering these signed-out
     * therefore leaves the query disabled, and every badge reads zero for a
     * reason that has nothing to do with what is being asserted.
     */
    const signedIn = {
      preloadedState: {
        auth: {
          // `as const` so the role stays the literal the store's union expects
          // rather than widening to `string`.
          user: { id: "u-1", email: "u@acme.test", role: "admin" as const },
          hydrated: true,
        },
      },
    };

    /**
     * Puts unread work of several kinds into one workspace.
     *
     * Layered over the shared stub rather than replacing it, so the screen
     * still reaches its rendered state and the assertions are about the badges
     * alone.
     */
    function withUnread(byKind: Record<string, number>) {
      const previous = get.getMockImplementation();

      get.mockImplementation((url: string) => {
        if (url.includes("unread-by-workspace")) {
          const total = Object.values(byKind).reduce((sum, n) => sum + n, 0);

          return Promise.resolve({
            data: {
              items: [{ workspace_id: "ws-1", total, by_kind: byKind }],
              total,
              by_kind: byKind,
            },
          });
        }

        return previous!(url);
      });
    }

    it("counts every kind a tab shows, not just one of them", async () => {
      /*
        Client Files shows stored files and requests for files. Counting only
        the files left every file request invisible here: the count still
        reached the workspace row and the header, where it could not be
        cleared from, so it accumulated permanently with nothing to say what
        it referred to.
      */
      withUnread({ workspace_file: 2, file_request: 3 });

      await renderScreen(<WorkspaceDetailScreen />, signedIn);

      await screen.findByText("Acme Holdings 2025");

      expect(await screen.findByText("5")).toBeTruthy();
    });

    it("clears every kind behind a tab when it is opened", async () => {
      /*
        Clearing only the first kind with anything waiting would leave the
        badge showing the remainder, which reads as the tap not having worked
        -- and the leftover could only be cleared by opening the same tab a
        second time.
      */
      withUnread({ workspace_file: 2, file_request: 3 });

      const patch = api.patch as jest.Mock;
      patch.mockResolvedValue({ data: null });

      await renderScreen(<WorkspaceDetailScreen />, signedIn);

      await screen.findByText("Acme Holdings 2025");
      await fireEvent.press(screen.getByText("Client Files"));

      await waitFor(() => {
        expect(patch).toHaveBeenCalledWith(
          "/workspaces/ws-1/notifications/workspace_file/read",
        );
        expect(patch).toHaveBeenCalledWith(
          "/workspaces/ws-1/notifications/file_request/read",
        );
      });
    });

    it("does not send a receipt for a kind with nothing waiting", async () => {
      // A receipt for an empty kind is a request that cannot change anything.
      withUnread({ workspace_file: 1 });

      const patch = api.patch as jest.Mock;
      patch.mockClear();
      patch.mockResolvedValue({ data: null });

      await renderScreen(<WorkspaceDetailScreen />, signedIn);

      await screen.findByText("Acme Holdings 2025");
      await fireEvent.press(screen.getByText("Client Files"));

      await waitFor(() => {
        expect(patch).toHaveBeenCalledWith(
          "/workspaces/ws-1/notifications/workspace_file/read",
        );
      });

      expect(patch).not.toHaveBeenCalledWith(
        "/workspaces/ws-1/notifications/file_request/read",
      );
    });
  });
});
