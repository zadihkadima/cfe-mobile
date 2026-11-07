import { HistoryEntry } from "../api/api";
import { describeAction, entryKind, historyRoute } from "./describeEntry";

const WS = "6a6ff86ba989c46f3717165e";
const TASK = "6a6ff86ba989c46f37171660";

function entry(partial: Partial<HistoryEntry> & { action: string }): HistoryEntry {
  return {
    method: partial.action.split(" ")[0],
    path: "/api/v1/whatever",
    status: 200,
    outcome: "success",
    duration_ms: 1,
    created_at: "2026-01-05T09:30:00Z",
    ...partial,
  };
}

describe("describeAction", () => {
  // The bug this file exists to fix. The last segment of a route template is
  // nearly always the parameter, so taking it as the noun made almost every
  // row read "Updated :id" -- the one word meant to say what was touched was
  // the one word carrying no information.
  it("never puts a route parameter in the sentence", () => {
    const actions = [
      "PATCH /api/v1/workspaces/:id",
      "DELETE /api/v1/workspaces/:id/tasks/:task_id",
      "PATCH /api/v1/admin/clients/:id",
      "POST /api/v1/workspaces/:id/signature-requests",
      "DELETE /api/v1/workspaces/:id/files/:file_id",
    ];

    for (const action of actions) {
      expect(describeAction(entry({ action }))).not.toContain(":");
    }
  });

  it("names the innermost record, not the container", () => {
    expect(
      describeAction(entry({ action: "DELETE /api/v1/workspaces/:id/tasks/:task_id" })),
    ).toBe("Deleted task");

    expect(
      describeAction(entry({ action: "POST /api/v1/workspaces/:id/checklists" })),
    ).toBe("Created checklist");
  });

  it("speaks of one record at a time", () => {
    expect(describeAction(entry({ action: "PATCH /api/v1/workspaces/:id" }))).toBe(
      "Updated workspace",
    );
  });

  // The method alone gets these wrong: a POST that fulfils a file request is
  // not "Created fulfil", and a PATCH that marks messages read is not
  // "Updated read".
  it("uses a written phrase where the method would mislead", () => {
    expect(describeAction(entry({ action: "POST /api/v1/auth/login" }))).toBe("Signed in");

    expect(
      describeAction(
        entry({
          action: "POST /api/v1/workspaces/:id/file-requests/:file_request_id/fulfil",
        }),
      ),
    ).toBe("Fulfilled a file request");

    expect(
      describeAction(entry({ action: "POST /api/v1/workspaces/:id/files/upload" })),
    ).toBe("Uploaded a file");

    expect(
      describeAction(entry({ action: "PATCH /api/v1/workspaces/:id/messages/read" })),
    ).toBe("Marked messages read");
  });

  // A route this build has not been taught still has to render as something
  // legible, and the concrete path says less than a sentence without ever
  // saying anything untrue.
  it("falls back to the path for a route it does not know", () => {
    const row = entry({ action: "POST /api/v1/gadgets/:id", path: "/api/v1/gadgets/7" });

    expect(describeAction(row)).toBe("Created /api/v1/gadgets/7");
  });
});

describe("historyRoute", () => {
  it("sends a nested record to the tab that lists it", () => {
    const row = entry({
      action: "DELETE /api/v1/workspaces/:id/tasks/:task_id",
      workspace_id: WS,
      resource: { id: WS, task_id: TASK },
    });

    expect(historyRoute(row)).toBe(`/user/admin/workspaces/${WS}/tasks`);
  });

  it("sends a workspace row to the workspace", () => {
    const row = entry({
      action: "PATCH /api/v1/workspaces/:id",
      workspace_id: WS,
      resource: { id: WS },
    });

    expect(historyRoute(row)).toBe(`/user/admin/workspaces/${WS}`);
  });

  it("sends a person row to their profile", () => {
    const row = entry({
      action: "PATCH /api/v1/admin/clients/:id",
      resource: { id: TASK },
    });

    expect(historyRoute(row)).toBe(`/user/admin/clients/${TASK}`);
  });

  // Signing in happened at no record. Offering a link there would land the
  // reader somewhere unrelated to the row they pressed.
  it("offers nothing for activity that happened at no record", () => {
    expect(historyRoute(entry({ action: "POST /api/v1/auth/login" }))).toBeNull();

    expect(
      historyRoute(entry({ action: "PATCH /api/v1/notifications/read-all" })),
    ).toBeNull();
  });

  // An entry whose parameters were not captured cannot produce a path, and a
  // link reading `/workspaces/undefined/tasks` navigates somewhere and renders
  // nothing, which reads as a broken record rather than a broken link.
  it("refuses to build a path without the identifiers", () => {
    expect(
      historyRoute(entry({ action: "DELETE /api/v1/workspaces/:id/tasks/:task_id" })),
    ).toBeNull();
  });

  it("never builds a path containing undefined", () => {
    const row = entry({
      action: "POST /api/v1/workspaces/:id/messages",
      workspace_id: WS,
    });

    expect(historyRoute(row)).not.toContain("undefined");
  });
});

describe("entryKind", () => {
  it("classifies a row by the record it concerns", () => {
    expect(entryKind(entry({ action: "POST /api/v1/workspaces/:id/tasks" }))).toBe("task");

    expect(
      entryKind(entry({ action: "POST /api/v1/workspaces/:id/signature-requests" })),
    ).toBe("signature_request");
  });

  // Signing in is real activity and belongs in the unfiltered trail, but it
  // concerns no record and so sits under no heading.
  it("leaves activity that concerns no record unclassified", () => {
    expect(entryKind(entry({ action: "POST /api/v1/auth/login" }))).toBeUndefined();
  });
});

describe("the entity the backend named", () => {
  // The backend now states which record an action touched. Reading that is
  // better than parsing the template, which infers the answer from the shape of
  // the path and is therefore only right for the shapes the rule anticipated.
  it("is preferred over the shape of the route", () => {
    const row = entry({
      action: "POST /api/v1/some/route/the/parser/has/never/seen",
      entity_type: "signature_request",
      workspace_id: WS,
    });

    expect(entryKind(row)).toBe("signature_request");
    expect(historyRoute(row)).toBe(`/user/admin/workspaces/${WS}/signatures`);
  });

  // Entries written before the backend learned to name events carry no entity
  // type at all, and they must keep working rather than becoming unclickable.
  it("falls back to the route when it is absent", () => {
    expect(entryKind(entry({ action: "POST /api/v1/workspaces/:id/tasks" }))).toBe(
      "task",
    );
  });

  // An account row is typed as a user by the backend; only the path says
  // whether the account was a client or a manager.
  it("still reads the path to tell a client from a manager", () => {
    const row = entry({
      action: "PATCH /api/v1/admin/managers/:id",
      entity_type: "user",
      resource: { id: "person-1" },
    });

    expect(entryKind(row)).toBe("manager");
    expect(historyRoute(row)).toBe("/user/admin/managers/person-1");
  });
});
