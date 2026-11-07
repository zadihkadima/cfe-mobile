import { formatRelativeTime } from "./formatRelativeTime";

const now = new Date("2026-08-01T12:00:00Z");

function ago(ms: number): Date {
  return new Date(now.getTime() - ms);
}

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

describe("formatRelativeTime", () => {
  it("reads as a person would say it", () => {
    expect(formatRelativeTime(ago(30_000), now)).toBe("just now");
    expect(formatRelativeTime(ago(5 * minute), now)).toBe("5m ago");
    expect(formatRelativeTime(ago(3 * hour), now)).toBe("3h ago");
    expect(formatRelativeTime(ago(day), now)).toBe("yesterday");
    expect(formatRelativeTime(ago(3 * day), now)).toBe("3d ago");
  });

  it("switches to a date once the count stops being useful", () => {
    // "43 days ago" is a number nobody converts into anything actionable.
    expect(formatRelativeTime(ago(43 * day), now)).toMatch(/Jun/);
  });

  it("omits the year within the current one and includes it otherwise", () => {
    // Repeated on every row, the year crowds out the part that differs.
    expect(formatRelativeTime(new Date("2026-03-12T00:00:00Z"), now)).not.toMatch(
      /2026/,
    );

    expect(formatRelativeTime(new Date("2024-03-12T00:00:00Z"), now)).toMatch(
      /2024/,
    );
  });

  it("does not count backwards when a clock is slightly ahead", () => {
    // Device clocks drift and servers record moments fractionally ahead of the
    // client. "in -3 seconds" is the sort of detail that makes an otherwise
    // careful product look unreliable.
    const slightlyAhead = new Date(now.getTime() + 30_000);

    expect(formatRelativeTime(slightlyAhead, now)).toBe("just now");
  });

  it("shows a genuinely future date as a date rather than a bogus count", () => {
    const nextYear = new Date("2027-01-15T00:00:00Z");

    expect(formatRelativeTime(nextYear, now)).toMatch(/2027/);
  });

  it("renders nothing for an unparseable value", () => {
    // Better an absent timestamp than a confident 1970.
    expect(formatRelativeTime("not a date", now)).toBe("");
  });
});
