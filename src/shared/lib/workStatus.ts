/**
 * The states a task or checklist can be in.
 *
 * Mirrors internal/common/workstate on the server, which rejects anything
 * outside this list. Offering a value the server refuses would produce a
 * failed save with no field to point at, so the two lists have to agree; the
 * contract test on the API side and this file are the only two places the
 * vocabulary appears.
 */
export const WORK_STATUSES = ["open", "in_progress", "completed", "cancelled"] as const;

export type WorkStatus = (typeof WORK_STATUSES)[number];

export const WORK_PRIORITIES = ["low", "medium", "high"] as const;

export type WorkPriority = (typeof WORK_PRIORITIES)[number];

/**
 * How each state is written for a person.
 *
 * "in_progress" is a wire format, not English, and showing it raw makes the
 * app look like a database viewer.
 */
const STATUS_LABELS: Record<WorkStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PRIORITY_LABELS: Record<WorkPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/** Reports whether a stored value is one this app understands. */
export function isWorkStatus(value: string): value is WorkStatus {
  return (WORK_STATUSES as readonly string[]).includes(value);
}

/**
 * Renders a status for display.
 *
 * An unrecognised value is passed through rather than hidden. Records created
 * before the server validated status may hold anything, and showing the raw
 * value is honest; replacing it with "Open" would tell the reader the work is
 * outstanding when nobody knows what it is.
 */
export function describeStatus(value: string): string {
  return isWorkStatus(value) ? STATUS_LABELS[value] : value;
}

export function describePriority(value: string): string {
  return value in PRIORITY_LABELS ? PRIORITY_LABELS[value as WorkPriority] : value;
}
