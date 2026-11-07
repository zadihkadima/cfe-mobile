import { AppNotification } from "../api/types";
import { describeNotification } from "./describeNotification";

function notification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: "n1",
    type: "task.updated",
    title: "Task updated",
    body: "Quarterly filing",
    entity_type: "task",
    entity_id: "t1",
    created_at: "2026-08-01T10:00:00Z",
    actor: { id: "u1", name: "Ada Lovelace" },
    ...overrides,
  };
}

describe("describeNotification", () => {

  /*
   * The whole point of the change. Before the server resolved actors, every
   * row in the feed read "Task updated" -- a report that something happened
   * with no indication of who did it, which is the first thing a reader wants
   * to know.
   */
  it("names the person and says what they did", () => {
    const { actor, action } = describeNotification(notification());

    expect(actor).toBe("Ada Lovelace");
    expect(action).toBe("updated the task “Quarterly filing”");
  });

  it("quotes the subject so its words do not run into the verb", () => {
    const { action } = describeNotification(
      notification({ type: "workspace_file.renamed", body: "2023 return" }),
    );

    // Without the quotes this reads "renamed 2023 return", which parses as
    // three separate things before it parses as a file name.
    expect(action).toBe("renamed “2023 return”");
  });

  /*
   * Everyone in a workspace hears that a task was created; only one person is
   * told they now own it. A row that reads identically in both cases loses the
   * only part that required their attention.
   */
  it("addresses the reader directly when the event was aimed at them", () => {
    const { action, directed } = describeNotification(
      notification({ type: "task.assigned", title: "Task assigned to you" }),
    );

    expect(action).toBe("assigned you the task “Quarterly filing”");
    expect(directed).toBe(true);
  });

  it("does not treat a workspace-wide event as personal", () => {
    expect(describeNotification(notification()).directed).toBe(false);
  });

  /*
   * The server can raise a kind of event before this app knows the word for
   * it. Assembling half a sentence would produce "updated the task X" with no
   * name in front of it, which reads as a bug; the stored title reads as
   * deliberate, because it was.
   */
  it("falls back to the stored title for a type it has not been taught", () => {
    const { actor, action } = describeNotification(
      notification({ type: "invoice.overdue", title: "Invoice overdue" }),
    );

    expect(actor).toBe("");
    expect(action).toBe("Invoice overdue — Quarterly filing");
  });

  // The account may have been deleted since the event. It still happened, and
  // is still worth showing unattributed rather than withholding.
  it("falls back when there is nobody to attribute the event to", () => {
    const { actor, action } = describeNotification(
      notification({ actor: undefined }),
    );

    expect(actor).toBe("");
    expect(action).toBe("Task updated — Quarterly filing");
  });

  it("omits the subject when the event has no body", () => {
    const { action } = describeNotification(
      notification({ type: "message.created", body: "" }),
    );

    expect(action).toBe("sent a message");
  });

  // An account invited but not yet registered has no name on file, and the
  // server sends the email instead. Whitespace-only is the case that would
  // otherwise pass the truthiness check and render a blank name.
  it("treats a blank name as no name at all", () => {
    const { actor } = describeNotification(
      notification({ actor: { id: "u1", name: "   " } }),
    );

    expect(actor).toBe("");
  });

});

describe("naming the workspace", () => {
  it("reports which engagement the event happened in", () => {
    const sentence = describeNotification(
      notification({
        type: "task.created",
        workspace_name: "Ford Holdings 2024",
      }),
    );

    expect(sentence.workspace).toBe("Ford Holdings 2024");
  });

  it("leaves the workspace empty when the event does not belong to one", () => {
    const sentence = describeNotification(
      notification({ type: "task.created" }),
    );

    expect(sentence.workspace).toBe("");
  });
});
