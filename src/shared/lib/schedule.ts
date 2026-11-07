/**
 * The shape the schedule helpers need, so they do not depend on the screen.
 *
 * Tasks and checklists both satisfy it, which is why these live in shared: the
 * overdue rule below is a policy decision and having two of it means having
 * two answers to "is this late".
 */
type Scheduled = {
  status: string;
  start_at?: string;
  due_at?: string;
};

function day(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Whether a scheduled record is late, judged now.
 *
 * Completed work is never overdue however late it was finished: a finished job
 * shown in red sends someone to chase work that is already done, and after
 * that happens twice the colour stops meaning anything.
 */
export function isOverdue(task: Scheduled): boolean {
  if (!task.due_at || task.status === "completed") {
    return false;
  }

  return new Date(task.due_at).getTime() < Date.now();
}

/** A one-line summary of when a piece of work runs. */
export function describeSchedule(task: Scheduled): string {
  const parts: string[] = [];

  if (task.start_at) {
    // Labelled "Starts" or "Started" so the reader does not have to work out
    // whether the date has passed to know if they can begin.
    const started = new Date(task.start_at).getTime() <= Date.now();

    parts.push(`${started ? "Started" : "Starts"} ${day(task.start_at)}`);
  }

  if (task.due_at) {
    parts.push(`${isOverdue(task) ? "Overdue since" : "Due"} ${day(task.due_at)}`);
  }

  return parts.join(" · ");
}
