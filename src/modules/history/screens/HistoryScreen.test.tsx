import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import { renderScreen } from "@/test-utils/renderScreen";
import { api } from "@/core/api/client";

import { HistoryScreen } from "./HistoryScreen";

jest.mock("@/core/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/user/settings/history",
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

const get = api.get as jest.Mock;

/**
 * Only the requests to one path, ignoring the notification poll the shared
 * header issues on every screen. Asserting on `get` as a whole would make
 * these tests fail whenever unrelated chrome starts or stops fetching.
 */
function callsTo(url: string): { params: Record<string, unknown> }[] {
  return get.mock.calls
    .filter(([called]: [string]) => called === url)
    .map(([, config]: [string, { params: Record<string, unknown> }]) => config);
}

const historyCalls = () => callsTo("/admin/history");
const suggestCalls = () => callsTo("/admin/history/suggest");

const entry = {
  action: "PATCH /api/v1/workspaces/:id",
  method: "PATCH",
  path: "/api/v1/workspaces/ws-1",
  status: 200,
  outcome: "success" as const,
  duration_ms: 8,
  created_at: "2026-01-05T09:30:00Z",
};

const person = {
  id: "u-jane",
  name: "Jane Roe",
  email: "jane@firm.test",
  role: "manager",
};

/** A page of the trail, with the paging fields the screen reads. */
function page(
  items: (typeof entry)[],
  { has_more = false, offset = 0 } = {}
) {
  return { data: { items, has_more, limit: 25, offset } };
}

beforeEach(() => {
  get.mockReset();

  get.mockImplementation((url: string) => {
    if (url === "/admin/history/suggest") {
      return Promise.resolve({ data: { items: [person] } });
    }

    return Promise.resolve(page([entry]));
  });
});

describe("HistoryScreen", () => {
  // The screen used to show nothing until an identifier had been typed, which
  // meant it could only answer questions an administrator already knew how to
  // ask. Recent activity on arrival is the whole point of the tool.
  it("loads recent activity without being asked", async () => {
    await renderScreen(<HistoryScreen />);

    await waitFor(() => expect(historyCalls().length).toBeGreaterThan(0));

    const params = historyCalls()[0].params;

    expect(params.actor_id).toBeUndefined();
    expect(params.email).toBeUndefined();

    // What makes the unscoped read affordable is the page size, not a filter.
    expect(params.limit).toBeGreaterThan(0);
  });

  it("shows the entries it loaded", async () => {
    await renderScreen(<HistoryScreen />);

    // Matched on the sentence rather than on the route, because the route is
    // no longer put in front of anybody.
    await waitFor(() =>
      expect(screen.getAllByText("Updated workspace").length).toBeGreaterThan(0)
    );
  });

  it("does not ask for suggestions on a single character", async () => {
    await renderScreen(<HistoryScreen />);

    await fireEvent.changeText( screen.getByLabelText("Search by name, email, or ID"), "j" );

    // One character matches most of the firm, so the list would be long,
    // useless, and requested on nearly every keystroke.
    await waitFor(() => expect(suggestCalls()).toHaveLength(0));
  });

  it("suggests people once enough has been typed", async () => {
    await renderScreen(<HistoryScreen />);

    await fireEvent.changeText( screen.getByLabelText("Search by name, email, or ID"), "jane" );

    await waitFor(() => expect(suggestCalls().length).toBeGreaterThan(0));

    expect(suggestCalls()[0].params.q).toBe("jane");

    await waitFor(() => expect(screen.getByText("Jane Roe")).toBeTruthy());
  });

  // The trail stores account ids, so a name typed into a filter that matches
  // ids returns nothing and reads as "this person did nothing" -- the
  // expensive wrong answer. Picking a suggestion is what supplies the id.
  it("scopes the trail to the person that was picked", async () => {
    await renderScreen(<HistoryScreen />);

    await fireEvent.changeText( screen.getByLabelText("Search by name, email, or ID"), "jane" );

    await waitFor(() =>
      expect(
        screen.getByLabelText("Show history for jane@firm.test")
      ).toBeTruthy()
    );

    await fireEvent.press( screen.getByLabelText("Show history for jane@firm.test") );

    await waitFor(() =>
      expect(
        historyCalls().some((call) => call.params.actor_id === "u-jane")
      ).toBe(true)
    );
  });

  it("offers no further page when the API says there is none", async () => {
    await renderScreen(<HistoryScreen />);

    await waitFor(() =>
      expect(screen.getAllByText("Updated workspace").length).toBeGreaterThan(0)
    );

    // Offering it anyway would produce a control that reloads the same rows,
    // which reads as the trail repeating itself.
    expect(screen.queryByLabelText("Load older activity")).toBeNull();
  });

  it("asks for the next page from where the last one ended", async () => {
    get.mockImplementation((url: string, config?: { params?: { offset?: number } }) => {
      if (url === "/admin/history/suggest") {
        return Promise.resolve({ data: { items: [] } });
      }

      if (config?.params?.offset) {
        return Promise.resolve(page([entry], { offset: 1 }));
      }

      return Promise.resolve(page([entry], { has_more: true }));
    });

    await renderScreen(<HistoryScreen />);

    await waitFor(() =>
      expect(screen.getByLabelText("Load older activity")).toBeTruthy()
    );

    await fireEvent.press(screen.getByLabelText("Load older activity"));

    // Offsetting by the page size rather than by what actually arrived would
    // skip or repeat rows whenever a page came back short.
    await waitFor(() =>
      expect(historyCalls().some((call) => call.params.offset === 1)).toBe(true)
    );
  });

  it("returns to recent activity when the person filter is cleared", async () => {
    await renderScreen(<HistoryScreen />);

    await fireEvent.changeText( screen.getByLabelText("Search by name, email, or ID"), "jane" );

    await waitFor(() =>
      expect(
        screen.getByLabelText("Show history for jane@firm.test")
      ).toBeTruthy()
    );

    await fireEvent.press( screen.getByLabelText("Show history for jane@firm.test") );

    await waitFor(() =>
      expect(screen.getByLabelText("Clear person filter")).toBeTruthy()
    );

    await fireEvent.press(screen.getByLabelText("Clear person filter"));

    // Leaving one person's activity on screen after their name has gone is
    // the most misleading thing this screen could do.
    await waitFor(() =>
      expect(screen.getByLabelText("Search by name, email, or ID")).toBeTruthy()
    );
  });
});

const ID = "6a6ff86ba989c46f3717165e";

const field = () => screen.getByLabelText("Search by name, email, or ID");

describe("HistoryScreen, searching by identifier", () => {
  // The point of accepting an id here is that an investigator holding one does
  // not know what it names. Making them choose a type from a picker first
  // would require the answer as the price of asking the question.
  it("says what a pasted identifier turned out to be", async () => {
    get.mockImplementation((url: string) => {
      if (url === `/admin/lookup/${ID}`) {
        return Promise.resolve({
          data: {
            id: ID,
            kind: "task",
            label: "File the 1099s",
            workspace_id: "ws-1",
            workspace_name: "Acme Accounting",
          },
        });
      }

      return Promise.resolve(page([entry]));
    });

    await renderScreen(<HistoryScreen />);

    await fireEvent.changeText(field(), ID);

    await waitFor(() => expect(screen.getByText("File the 1099s")).toBeTruthy());

    expect(screen.getByText("Task")).toBeTruthy();
    expect(screen.getByText("in Acme Accounting")).toBeTruthy();
    expect(screen.getByLabelText("Open this record")).toBeTruthy();
  });

  it("scopes the trail to that record", async () => {
    get.mockImplementation((url: string) => {
      if (url === `/admin/lookup/${ID}`) {
        return Promise.resolve({ data: { id: ID, kind: "workspace", label: "Acme" } });
      }

      return Promise.resolve(page([entry]));
    });

    await renderScreen(<HistoryScreen />);

    await fireEvent.changeText(field(), ID);

    await waitFor(() =>
      expect(historyCalls().some((call) => call.params.resource_id === ID)).toBe(true)
    );
  });

  // An id is never a name, so firing a directory search for it would draw
  // "Nobody matches that" underneath a record that was found perfectly well.
  it("does not search the directory for an identifier", async () => {
    await renderScreen(<HistoryScreen />);

    await fireEvent.changeText(field(), ID);

    await waitFor(() => expect(historyCalls().length).toBeGreaterThan(0));

    expect(suggestCalls()).toHaveLength(0);
  });

  // The trail outlives what it describes. An id with activity but no record is
  // a deleted record, which is usually the thing worth looking at rather than
  // the thing to hide behind an error.
  it("still shows the trail when nothing answers to the identifier", async () => {
    get.mockImplementation((url: string) => {
      if (url === `/admin/lookup/${ID}`) {
        // Shaped like an axios rejection, which is what the code under test
        // reads the status off. A bare object would lint as a non-Error
        // rejection and would not carry a stack if anything else went wrong.
        return Promise.reject(Object.assign(new Error("Not Found"), {
          response: { status: 404 },
        }));
      }

      return Promise.resolve(page([entry]));
    });

    await renderScreen(<HistoryScreen />);

    await fireEvent.changeText(field(), ID);

    await waitFor(() =>
      expect(screen.getByText("No current record has this ID")).toBeTruthy()
    );

    expect(historyCalls().some((call) => call.params.resource_id === ID)).toBe(true);
  });

  // A partial paste is neither a failed search nor a missing record, and
  // saying either about it would be wrong more often than right.
  it("waits for a whole identifier before asking anything", async () => {
    await renderScreen(<HistoryScreen />);

    await fireEvent.changeText(field(), ID.slice(0, 10));

    await waitFor(() => expect(historyCalls().length).toBeGreaterThan(0));

    expect(callsTo(`/admin/lookup/${ID.slice(0, 10)}`)).toHaveLength(0);
  });
});

describe("HistoryScreen, narrowing by record type", () => {
  const taskEntry = {
    ...entry,
    action: "POST /api/v1/workspaces/:id/tasks",
    method: "POST",
    workspace_id: "ws-1",
    resource: { id: "ws-1" },
  };

  it("shows everything until a type is chosen", async () => {
    get.mockImplementation(() => Promise.resolve(page([entry, taskEntry])));

    await renderScreen(<HistoryScreen />);

    await waitFor(() => expect(screen.getByText("Updated workspace")).toBeTruthy());

    expect(screen.getByText("Created task")).toBeTruthy();
  });

  it("keeps only the chosen type", async () => {
    get.mockImplementation(() => Promise.resolve(page([entry, taskEntry])));

    await renderScreen(<HistoryScreen />);

    await waitFor(() => expect(screen.getByText("Updated workspace")).toBeTruthy());

    await fireEvent.press(screen.getByLabelText("Filter by record type"));

    await fireEvent.press(screen.getByLabelText("Tasks"));

    await waitFor(() => expect(screen.queryByText("Updated workspace")).toBeNull());

    expect(screen.getByText("Created task")).toBeTruthy();
  });

  // An empty list after filtering has a cause the reader chose, and saying so
  // stops them concluding that nothing has happened at all.
  it("says when the filter is what emptied the list", async () => {
    get.mockImplementation(() => Promise.resolve(page([entry])));

    await renderScreen(<HistoryScreen />);

    await waitFor(() => expect(screen.getByText("Updated workspace")).toBeTruthy());

    await fireEvent.press(screen.getByLabelText("Filter by record type"));

    await fireEvent.press(screen.getByLabelText("Signature requests"));

    await waitFor(() =>
      expect(screen.getByText("No recorded activity of this type.")).toBeTruthy()
    );
  });
});


