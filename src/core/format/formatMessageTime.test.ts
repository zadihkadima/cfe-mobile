import {
  formatDayLabel,
  formatMessageTime,
  isDifferentDay,
} from "./formatMessageTime";

describe("formatMessageTime", () => {
  it("renders a twelve hour time", () => {
    expect(formatMessageTime(new Date(2026, 0, 3, 21, 5).toISOString())).toBe(
      "9:05 pm",
    );
  });

  // `0:05 am` is not a time anybody writes.
  it("renders midnight as twelve", () => {
    expect(formatMessageTime(new Date(2026, 0, 3, 0, 5).toISOString())).toBe(
      "12:05 am",
    );
  });

  it("renders noon as twelve", () => {
    expect(formatMessageTime(new Date(2026, 0, 3, 12, 0).toISOString())).toBe(
      "12:00 pm",
    );
  });

  it("pads the minutes", () => {
    expect(formatMessageTime(new Date(2026, 0, 3, 9, 7).toISOString())).toBe(
      "9:07 am",
    );
  });

  // The previous implementation put the string "Invalid Date" under a message.
  it("renders nothing rather than the words Invalid Date", () => {
    expect(formatMessageTime("not a timestamp")).toBe("");
  });
});

describe("formatDayLabel", () => {
  const now = new Date(2026, 5, 15, 10, 0);

  it("names today", () => {
    expect(formatDayLabel(new Date(2026, 5, 15, 1, 0).toISOString(), now)).toBe(
      "Today",
    );
  });

  it("names yesterday", () => {
    expect(formatDayLabel(new Date(2026, 5, 14, 23, 0).toISOString(), now)).toBe(
      "Yesterday",
    );
  });

  // Inside a week the weekday is read faster than a date the reader has to
  // work out for themselves.
  it("uses the weekday within the last week", () => {
    expect(formatDayLabel(new Date(2026, 5, 11).toISOString(), now)).toBe(
      "Thursday",
    );
  });

  it("uses the date once the weekday stops being useful", () => {
    expect(formatDayLabel(new Date(2026, 2, 4).toISOString(), now)).toBe(
      "4 March",
    );
  });

  // Repeating the current year on every separator is noise; omitting it from a
  // different year is a lie.
  it("adds the year only when it is not the current one", () => {
    expect(formatDayLabel(new Date(2024, 2, 4).toISOString(), now)).toBe(
      "4 March 2024",
    );
  });

  it("renders nothing for an unparseable timestamp", () => {
    expect(formatDayLabel("not a timestamp", now)).toBe("");
  });
});

describe("isDifferentDay", () => {
  // Timestamps are stored in UTC, so comparing the date portion as text puts
  // two messages sent minutes apart on different days, and two sent a day
  // apart on the same one.
  it("compares local calendar days, not UTC dates", () => {
    const lateEvening = new Date(2026, 0, 3, 23, 30);
    const nearMidnight = new Date(2026, 0, 3, 23, 59);

    expect(
      isDifferentDay(lateEvening.toISOString(), nearMidnight.toISOString()),
    ).toBe(false);
  });

  it("detects a crossing into the next day", () => {
    expect(
      isDifferentDay(
        new Date(2026, 0, 4, 0, 5).toISOString(),
        new Date(2026, 0, 3, 23, 55).toISOString(),
      ),
    ).toBe(true);
  });

  it("treats an unreadable timestamp as no boundary", () => {
    expect(isDifferentDay("nonsense", new Date().toISOString())).toBe(false);
  });
});
