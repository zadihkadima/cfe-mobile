import { resolveEntityRoute } from "../notificationRoute";

describe("resolveEntityRoute", () => {
  it("opens the record itself when it has a screen of its own", () => {
    // A notification names one task. Landing on the list of every task in the
    // workspace leaves the reader to find it again, which is the work the
    // notification was supposed to save them.
    expect(
      resolveEntityRoute({
        entity_type: "task",
        entity_id: "t1",
        workspace_id: "w1",
      }),
    ).toBe("/user/workspaces/w1/tasks/t1/edit");
  });

  it("opens the section for a type with no screen of its own", () => {
    // Only three of the eight types have a per-record screen. Inventing a
    // route for the others would land the reader on not-found.
    expect(
      resolveEntityRoute({
        entity_type: "signature_request",
        entity_id: "s1",
        workspace_id: "w1",
      }),
    ).toBe("/user/workspaces/w1/signatures");
  });

  it("maps every entity type the backend emits to a real route", () => {
    const types = [
      "checklist",
      "file_request",
      "irs_submission",
      "message",
      "questionnaire",
      "signature_request",
      "task",
      "workspace_file",
    ];

    for (const entity_type of types) {
      const route = resolveEntityRoute({
        entity_type,
        entity_id: "e1",
        workspace_id: "w1",
      });

      // Landing on the workspace itself would mean the type fell through to
      // the unknown-type branch, which is the failure this guards against.
      expect(route).not.toBe("/user/workspaces/w1");
      expect(route).toMatch(/^\/user\/workspaces\/w1\/[a-z-]+/);
    }
  });

  it("goes to a person's own screen rather than a workspace", () => {
    expect(
      resolveEntityRoute({ entity_type: "client", entity_id: "c1" }),
    ).toBe("/user/admin/clients/c1");
    expect(
      resolveEntityRoute({ entity_type: "manager", entity_id: "m1" }),
    ).toBe("/user/admin/managers/m1");
  });

  it("falls back to the workspace when the entity type is unknown", () => {
    expect(
      resolveEntityRoute({
        entity_type: "something_added_later",
        entity_id: "x1",
        workspace_id: "w1",
      }),
    ).toBe("/user/workspaces/w1");
  });

  it("returns nothing when a workspace section has no workspace to open", () => {
    // Better inert than wrong: guessing here would navigate the user away
    // from what they were reading, to a screen about somebody else's work.
    expect(
      resolveEntityRoute({ entity_type: "task", entity_id: "t1" }),
    ).toBeNull();
    expect(
      resolveEntityRoute({ entity_type: "something_added_later", entity_id: "x" }),
    ).toBeNull();
  });

  it("still opens messages without a workspace, because that screen exists", () => {
    expect(
      resolveEntityRoute({ entity_type: "message", entity_id: "m1" }),
    ).toBe("/user/messages");
  });

  it("returns nothing when the id is missing", () => {
    expect(
      resolveEntityRoute({ entity_type: "workspace", entity_id: "" }),
    ).toBeNull();
  });
});

describe("resolveEntityRoute, deleted records", () => {

  /*
   * A notification about a deletion is the one case where the record is
   * guaranteed not to be there. Opening its edit screen asks the server for
   * something it will refuse, so the reader gets an error page instead of the
   * list that would have shown them the record is gone.
   */
  it("stops at the list when the record has been deleted", () => {
    expect(
      resolveEntityRoute({
        type: "task.deleted",
        entity_type: "task",
        entity_id: "t1",
        workspace_id: "w1",
      }),
    ).toBe("/user/workspaces/w1/tasks");
  });

  it("still opens the record for every other event on it", () => {
    for (const type of ["task.created", "task.updated", "task.assigned", "task.completed"]) {
      expect(
        resolveEntityRoute({
          type,
          entity_type: "task",
          entity_id: "t1",
          workspace_id: "w1",
        }),
      ).toBe("/user/workspaces/w1/tasks/t1/edit");
    }
  });

});

describe("resolveEntityRoute, by role", () => {

  /*
   * Administrators have their own tree of workspace screens. Sending them to
   * the shared ones opened a screen their own navigation never links to, so
   * every notification an administrator received left them somewhere they
   * could not have reached and could not navigate back through.
   */
  it("builds an administrator's route in the administrator's tree", () => {
    expect(
      resolveEntityRoute(
        { entity_type: "task", entity_id: "t1", workspace_id: "w1" },
        "admin",
      ),
    ).toBe("/user/admin/workspaces/w1/tasks/t1/edit");
  });

  it("keeps managers and clients on the shared screens", () => {
    for (const role of ["manager", "client"] as const) {
      expect(
        resolveEntityRoute(
          { entity_type: "task", entity_id: "t1", workspace_id: "w1" },
          role,
        ),
      ).toBe("/user/workspaces/w1/tasks/t1/edit");
    }
  });

  it("sends an administrator to their own workspace screen", () => {
    expect(
      resolveEntityRoute({ entity_type: "workspace", entity_id: "w1" }, "admin"),
    ).toBe("/user/admin/workspaces/w1");
  });

});
