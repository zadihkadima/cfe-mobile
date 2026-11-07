/**
 * Scheduled dates are entered as plain days and stored as instants.
 *
 * The forms sent `YYYY-MM-DD` straight to endpoints that parse RFC3339, so
 * every date typed into them was rejected and the record saved without one.
 * The failure was silent because the field looked filled in right up until the
 * screen closed.
 *
 * Shared rather than owned by one module: tasks and checklists are scheduled
 * the same way by the same API, and a second copy of this would drift from the
 * first the moment either grew a rule.
 */

/** Turns a date-only entry into the timestamp the API expects. */
export function toApiDate(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    // Empty means "clear it", which the API distinguishes from "leave it".
    return null;
  }

  // Already an instant, so it is passed through rather than re-parsed. Parsing
  // it again would drop the time a user may have set elsewhere.
  if (trimmed.includes("T")) {
    return trimmed;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;

  // Midday UTC rather than midnight. A date stored at midnight UTC displays as
  // the previous day for anyone west of Greenwich, so a deadline typed as the
  // 15th shows as the 14th to half the users.
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

/** Turns a stored instant back into the date the field shows. */
export function toDateField(value?: string | null): string {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

/**
 * Reports what is wrong with a pair of dates, or null if nothing is.
 *
 * Checked before the request so the user is told at the field rather than by a
 * server error that names neither date.
 */
export function validateDateRange(start: string, due: string): string | null {
  if (start.trim() && !toApiDate(start)) {
    return "Start date must be YYYY-MM-DD.";
  }

  if (due.trim() && !toApiDate(due)) {
    return "Due date must be YYYY-MM-DD.";
  }

  const startAt = toApiDate(start);
  const dueAt = toApiDate(due);

  if (startAt && dueAt && new Date(startAt) > new Date(dueAt)) {
    return "The due date cannot be before the start date.";
  }

  return null;
}
