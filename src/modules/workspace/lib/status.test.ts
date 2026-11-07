import {
  WORKSPACE_STATUSES,
  WORKSPACE_STATUS_DESCRIPTIONS,
  WORKSPACE_STATUS_LABELS,
  WORKSPACE_STATUS_TONES,
  workspaceStatus,
} from "./status";

describe("workspaceStatus", () => {
  it("reports the status it was given", () => {
    for (const status of WORKSPACE_STATUSES) {
      expect(workspaceStatus({ status })).toBe(status);
    }
  });

  // Workspaces created before the field existed have none. The API reports
  // those as ongoing, but a blank arriving here would fall through every
  // comparison and render as no badge at all, which reads as a broken row
  // rather than as an old record.
  it("treats a missing status as ongoing", () => {
    expect(workspaceStatus({})).toBe("ongoing");
    expect(workspaceStatus({ status: "" })).toBe("ongoing");
  });

  // A value from a newer server must not be passed through to a lookup that
  // has no entry for it, which would produce an undefined label and an
  // undefined tone -- a badge with no words in it.
  it("falls back for a status it does not recognise", () => {
    expect(workspaceStatus({ status: "abandoned" })).toBe("ongoing");
  });
});

describe("the status vocabulary", () => {
  it("names and explains every status", () => {
    for (const status of WORKSPACE_STATUSES) {
      expect(WORKSPACE_STATUS_LABELS[status]).toBeTruthy();
      expect(WORKSPACE_STATUS_DESCRIPTIONS[status]).toBeTruthy();
      expect(WORKSPACE_STATUS_TONES[status]).toBeTruthy();
    }
  });

  // "unfinished-halted" is the stored value and is not a phrase anyone says.
  // Deriving the label would print "Unfinished halted".
  it("does not show a stored value as a label", () => {
    for (const status of WORKSPACE_STATUSES) {
      expect(WORKSPACE_STATUS_LABELS[status]).not.toContain("-");
    }
  });

  // Two statuses sharing a label makes the filter tabs ambiguous and the badge
  // meaningless, and nothing else in the app would report the collision.
  it("gives each status its own label", () => {
    const labels = WORKSPACE_STATUSES.map((status) => WORKSPACE_STATUS_LABELS[status]);

    expect(new Set(labels).size).toBe(labels.length);
  });

  // Cancelled is neutral on purpose. Danger is for something wrong that wants
  // attention, and a closed matter would pull the eye down a list towards the
  // rows least in need of it.
  it("reserves the alarming tones for states that need attention", () => {
    expect(WORKSPACE_STATUS_TONES.cancelled).toBe("neutral");
    expect(WORKSPACE_STATUS_TONES["unfinished-halted"]).toBe("warning");
    expect(WORKSPACE_STATUS_TONES.completed).toBe("success");
  });
});
