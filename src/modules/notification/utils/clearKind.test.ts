import { clearKind } from "./clearKind";

import type { UnreadSummary } from "../api/types";

function summary(): UnreadSummary {
  return {
    total: 12,
    by_kind: { message: 7, task: 5 },
    items: [
      {
        workspace_id: "w1",
        total: 9,
        by_kind: { message: 4, task: 5 },
      },
      {
        workspace_id: "w2",
        total: 3,
        by_kind: { message: 3 },
      },
    ],
  };
}

describe("clearing one workspace tab", () => {
  it("empties the tab that was opened", () => {
    const after = clearKind(summary(), "w1", "task");

    expect(after.items[0].by_kind.task).toBe(0);
  });

  // Opening the tasks tab says nothing about whether the messages have been
  // read, and clearing them would lose the reader's place.
  it("leaves the other tabs of that workspace alone", () => {
    const after = clearKind(summary(), "w1", "task");

    expect(after.items[0].by_kind.message).toBe(4);
  });

  it("leaves other workspaces alone", () => {
    const after = clearKind(summary(), "w1", "message");

    expect(after.items[1].by_kind.message).toBe(3);
    expect(after.items[1].total).toBe(3);
  });

  // The workspace row badge and the header badge are drawn from these, so if
  // they are not adjusted the tab clears while the row still shows a number.
  it("takes the cleared count off the workspace total", () => {
    const after = clearKind(summary(), "w1", "task");

    expect(after.items[0].total).toBe(4);
  });

  it("takes the cleared count off the overall totals", () => {
    const after = clearKind(summary(), "w1", "task");

    expect(after.total).toBe(7);
    expect(after.by_kind.task).toBe(0);
  });

  it("only subtracts that workspace's share from the header count", () => {
    // w1 holds 4 of the 7 unread messages, so the header must still show 3.
    const after = clearKind(summary(), "w1", "message");

    expect(after.by_kind.message).toBe(3);
    expect(after.total).toBe(8);
  });

  // Returning the same object rather than an equal one lets React skip the
  // re-render, which matters because a workspace list redraws every row.
  it("returns the same object when there was nothing to clear", () => {
    const before = summary();

    expect(clearKind(before, "w1", "checklist")).toBe(before);
    expect(clearKind(before, "w2", "task")).toBe(before);
    expect(clearKind(before, "unknown-workspace", "message")).toBe(before);
  });

  it("does not change the original", () => {
    const before = summary();

    clearKind(before, "w1", "task");

    expect(before.items[0].by_kind.task).toBe(5);
    expect(before.total).toBe(12);
  });

  // A badge reading "-2" is a worse failure than a stale one, and drift is
  // possible whenever the server and the cache disagree.
  it("never produces a negative badge when the counts have drifted", () => {
    const drifted: UnreadSummary = {
      total: 1,
      by_kind: { message: 1 },
      items: [{ workspace_id: "w1", total: 1, by_kind: { message: 9 } }],
    };

    const after = clearKind(drifted, "w1", "message");

    expect(after.total).toBeGreaterThanOrEqual(0);
    expect(after.by_kind.message).toBeGreaterThanOrEqual(0);
    expect(after.items[0].total).toBeGreaterThanOrEqual(0);
  });
});
