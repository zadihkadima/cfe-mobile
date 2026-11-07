/**
 * Formats message timestamps without relying on Intl.
 *
 * `toLocaleTimeString` was used previously. On Hermes the Intl support that
 * backs it is not guaranteed to be present, and where it is absent the options
 * are ignored and the whole date is returned instead of a time — which is why
 * the timestamp under a message looked wrong or missing depending on the
 * device it was read on. Formatting explicitly gives the same output
 * everywhere.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function parse(value: string): Date | null {
  const date = new Date(value);

  // An unparseable timestamp yields NaN, and every downstream call then returns
  // the string "Invalid Date". Returning null lets the caller render nothing
  // rather than put that in front of a user.
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Midnight local time, for comparing which calendar day two instants fall on. */
function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

/**
 * The time of day a message was sent, as `9:05 pm`.
 */
export function formatMessageTime(value: string): string {
  const date = parse(value);

  if (!date) {
    return "";
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Midnight is twelve, not zero: `0:05 am` is not a time anybody writes.
  const display = hours % 12 === 0 ? 12 : hours % 12;

  return `${display}:${minutes.toString().padStart(2, "0")} ${
    hours < 12 ? "am" : "pm"
  }`;
}

/**
 * The label for a day separator in a conversation.
 *
 * Recent days are named rather than dated, because "Yesterday" is read faster
 * than a date the reader has to work out. Anything inside the last week keeps
 * its weekday for the same reason. Older than that and the weekday stops being
 * useful, so the actual date is shown — with the year only when it is not the
 * current one, since repeating it on every separator is noise.
 */
export function formatDayLabel(value: string, now: Date = new Date()): string {
  const date = parse(value);

  if (!date) {
    return "";
  }

  const days = Math.round((startOfDay(now) - startOfDay(date)) / MS_PER_DAY);

  if (days === 0) {
    return "Today";
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days > 1 && days < 7) {
    return DAYS[date.getDay()];
  }

  const label = `${date.getDate()} ${MONTHS[date.getMonth()]}`;

  return date.getFullYear() === now.getFullYear()
    ? label
    : `${label} ${date.getFullYear()}`;
}

/**
 * Whether two messages fall on different calendar days.
 *
 * Comparing the date portion of the timestamps as strings would be wrong: they
 * are stored in UTC, so two messages either side of local midnight can share a
 * UTC date, and two sent minutes apart can straddle one.
 */
export function isDifferentDay(a: string, b: string): boolean {
  const first = parse(a);
  const second = parse(b);

  if (!first || !second) {
    return false;
  }

  return startOfDay(first) !== startOfDay(second);
}
