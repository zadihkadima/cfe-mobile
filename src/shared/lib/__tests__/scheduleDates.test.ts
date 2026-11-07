import { describeSchedule, isOverdue } from "../schedule";
import { toApiDate, toDateField, validateDateRange } from "../scheduleDates";

describe("toApiDate", () => {
  it("turns a typed day into the timestamp the API accepts", () => {
    // The forms previously sent YYYY-MM-DD to an endpoint that parses RFC3339,
    // so every date entered was rejected and the task saved without one.
    expect(toApiDate("2026-03-15")).toMatch(/^2026-03-15T/);
  });

  it("keeps the day the user typed in every timezone", () => {
    // Stored at midnight UTC, this shows as the 14th to anyone west of
    // Greenwich, so a deadline moves a day depending on who reads it.
    const iso = toApiDate("2026-03-15") as string;

    expect(new Date(iso).getUTCHours()).toBe(12);
  });

  it("treats an empty field as a clear rather than a mistake", () => {
    expect(toApiDate("")).toBeNull();
    expect(toApiDate("   ")).toBeNull();
  });

  it("refuses something that is not a date", () => {
    expect(toApiDate("next tuesday")).toBeNull();
  });

  it("round-trips through the field", () => {
    const iso = toApiDate("2026-03-15") as string;

    expect(toDateField(iso)).toBe("2026-03-15");
  });
});

describe("validateDateRange", () => {
  it("refuses a due date before the start date", () => {
    expect(validateDateRange("2026-03-15", "2026-03-01")).toMatch(/before the start/i);
  });

  it("accepts a pair in the right order", () => {
    expect(validateDateRange("2026-03-01", "2026-03-15")).toBeNull();
  });

  it("accepts either date on its own", () => {
    expect(validateDateRange("", "2026-03-15")).toBeNull();
    expect(validateDateRange("2026-03-01", "")).toBeNull();
  });

  it("names the field that is malformed", () => {
    expect(validateDateRange("soon", "")).toMatch(/start date/i);
    expect(validateDateRange("", "soon")).toMatch(/due date/i);
  });
});

describe("isOverdue", () => {
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const future = new Date(Date.now() + 86_400_000).toISOString();

  it("flags an unfinished task past its date", () => {
    expect(isOverdue({ status: "open", due_at: past })).toBe(true);
  });

  it("never flags a finished one", () => {
    // A completed task shown in red sends someone to chase work already done,
    // and after that the colour stops meaning anything.
    expect(isOverdue({ status: "completed", due_at: past })).toBe(false);
  });

  it("does not flag a task with no date", () => {
    expect(isOverdue({ status: "open" })).toBe(false);
  });

  it("does not flag one that is merely upcoming", () => {
    expect(isOverdue({ status: "open", due_at: future })).toBe(false);
  });
});

describe("describeSchedule", () => {
  it("says whether the work can be started yet", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();

    expect(describeSchedule({ status: "open", start_at: future })).toMatch(/^Starts /);
  });

  it("mentions both dates when both are set", () => {
    const line = describeSchedule({
      status: "open",
      start_at: new Date(Date.now() - 86_400_000).toISOString(),
      due_at: new Date(Date.now() + 86_400_000).toISOString(),
    });

    expect(line).toContain("Started");
    expect(line).toContain("Due");
  });
});
