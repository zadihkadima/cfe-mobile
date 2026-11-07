import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  describePriority,
  describeStatus,
  isWorkStatus,
  WORK_PRIORITIES,
  WORK_STATUSES,
} from "../workStatus";

describe("work status vocabulary", () => {
  it("labels every state in plain English", () => {
    for (const status of WORK_STATUSES) {
      const label = describeStatus(status);

      // "in_progress" is a wire format, not English. Showing it raw makes the
      // app look like a database viewer.
      expect(label).not.toContain("_");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("passes an unrecognised value through rather than hiding it", () => {
    // Records created before the server validated status may hold anything.
    // Relabelling one as "Open" would tell the reader the work is outstanding
    // when in truth nobody knows what it is.
    expect(describeStatus("legacy-thing")).toBe("legacy-thing");
    expect(describePriority("urgent")).toBe("urgent");
  });

  it("recognises exactly the states it offers", () => {
    for (const status of WORK_STATUSES) {
      expect(isWorkStatus(status)).toBe(true);
    }

    expect(isWorkStatus("Completed")).toBe(false);
    expect(isWorkStatus("done")).toBe(false);
  });
});

/**
 * The server rejects any status outside its own list, so a value offered here
 * that it does not know produces a failed save with no field to point at. The
 * two lists are read from source rather than duplicated into this test, so it
 * fails when either side changes alone.
 *
 * Skipped when the backend is not checked out beside this repo, which is the
 * case in mobile CI. That makes it a local guard rather than a gate: it catches
 * the drift on the machine where the change is being made, which is where it
 * can still be fixed cheaply. Making it a hard gate would mean checking out a
 * second repository to run the mobile unit tests.
 */
const backendVocabulary = join(
  __dirname,
  "../../../../../cfe-backend/internal/common/workstate/workstate.go",
);

const describeIfBackendPresent = existsSync(backendVocabulary) ? describe : describe.skip;

describeIfBackendPresent("parity with the backend vocabulary", () => {
  function backendValues(constants: string[]): string[] {
    const source = readFileSync(backendVocabulary, "utf8");

    return constants.map((name) => {
      const match = new RegExp(`${name}\\s*=\\s*"([^"]+)"`).exec(source);

      if (!match) {
        throw new Error(`could not find ${name} in ${backendVocabulary}`);
      }

      return match[1];
    });
  }

  it("offers the same statuses the server accepts", () => {
    const expected = backendValues([
      "StatusOpen",
      "StatusInProgress",
      "StatusCompleted",
      "StatusCancelled",
    ]);

    expect([...WORK_STATUSES].sort()).toEqual([...expected].sort());
  });

  it("offers the same priorities the server accepts", () => {
    const expected = backendValues(["PriorityLow", "PriorityMedium", "PriorityHigh"]);

    expect([...WORK_PRIORITIES].sort()).toEqual([...expected].sort());
  });
});
