/**
 * Formats a timestamp the way a person would say it.
 *
 * Absolute dates are precise and almost always the wrong unit for a list. A row
 * reading "31 July 2026" forces the reader to work out how long ago that was,
 * and the answer is usually all they wanted; "yesterday" is less precise and
 * more informative. The scale flips back to an absolute date past a week,
 * because "43 days ago" is a number nobody converts into anything useful.
 *
 * Deliberately not a dependency. Every date library is heavier than this, and
 * the only rule that matters on a tax platform is the one below about the
 * future.
 */
export function formatRelativeTime(
  value: string | number | Date,
  now: Date = new Date(),
): string {
  const date = value instanceof Date ? value : new Date(value);

  // An unparseable date should not read as 1970. Returning an empty string
  // lets the caller render nothing rather than something confidently wrong.
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

  // Future timestamps happen: a device clock drifts, or a server records a
  // moment fractionally ahead of the client. "in -3 seconds" is the kind of
  // detail that makes an otherwise careful product look unreliable, so
  // anything within a couple of minutes ahead is treated as now, and anything
  // genuinely in the future gets a plain date rather than a bogus count.
  if (seconds < -120) {
    return formatAbsolute(date, now);
  }

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "yesterday";
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatAbsolute(date, now);
}

/**
 * Renders a date without its year when it falls in the current one.
 *
 * "12 Mar" carries everything "12 Mar 2026" does while reading in half the
 * space, and in a list the year repeated on every row is noise that crowds out
 * the part that differs.
 */
function formatAbsolute(date: Date, now: Date): string {
  const sameYear = date.getFullYear() === now.getFullYear();

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
