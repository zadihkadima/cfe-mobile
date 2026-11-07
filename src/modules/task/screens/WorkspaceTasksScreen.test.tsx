import { renderScreen } from "@/test-utils/renderScreen";
import { waitFor } from "@testing-library/react-native";

import { api } from "@/core/api/client";

import { WorkspaceTasksScreen } from "./WorkspaceTasksScreen";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/user/workspaces/ws-1/tasks",
}));

jest.mock("@/core/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const get = api.get as jest.Mock;
const patch = api.patch as jest.Mock;

function stubUnread(byKind: Record<string, number>) {
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

    return Promise.resolve({ data: { items: [], total: 0 } });
  });
}

beforeEach(() => {
  get.mockReset();
  patch.mockReset();
  patch.mockResolvedValue({ data: null });
});

describe("WorkspaceTasksScreen", () => {
  /**
   * A signed-in session.
   *
   * Unread counts are per-person, so the hook behind the badge refuses to
   * fetch until the session has been read back and somebody is signed in --
   * otherwise a cold start fires a request that can only 401, and the answer
   * would belong to nobody in particular. Rendered signed-out, the query stays
   * disabled and the count reads zero, so a test about clearing the badge
   * would pass or fail for a reason that has nothing to do with clearing it.
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
   * The regression this covers.
   *
   * The badge used to be cleared by the workspace tab, so it was only cleared
   * for people who arrived that way. Tapping a task notification, or following
   * a deep link, opened this same list without the count going down -- and
   * because only the tab could clear it, reading the work any number of times
   * left the number exactly where it was.
   */
  it("clears its badge when opened directly, not only through the tab", async () => {
    stubUnread({ task: 4 });

    await renderScreen(<WorkspaceTasksScreen workspaceId="ws-1" />, signedIn);

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith(
        "/workspaces/ws-1/notifications/task/read",
      );
    });
  });

  it("sends one receipt rather than repeating while the count settles", async () => {
    /*
      Clearing a badge changes the counts this reads, so without remembering
      what it has already cleared the effect answers its own condition and
      sends receipts until the number stops moving.
    */
    stubUnread({ task: 4 });

    await renderScreen(<WorkspaceTasksScreen workspaceId="ws-1" />, signedIn);

    await waitFor(() => {
      expect(patch).toHaveBeenCalled();
    });

    const receipts = patch.mock.calls.filter(
      ([url]: [string]) => url === "/workspaces/ws-1/notifications/task/read",
    );

    expect(receipts).toHaveLength(1);
  });

  it("sends no receipt when nothing is waiting", async () => {
    // A receipt for an empty kind is a request that cannot change anything.
    stubUnread({});

    await renderScreen(<WorkspaceTasksScreen workspaceId="ws-1" />, signedIn);

    await waitFor(() => {
      expect(get).toHaveBeenCalled();
    });

    expect(patch).not.toHaveBeenCalledWith(
      "/workspaces/ws-1/notifications/task/read",
    );
  });
});
