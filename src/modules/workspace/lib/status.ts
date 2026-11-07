/**
 * Where a piece of work stands.
 *
 * Distinct from `is_archived`, which is about whether a workspace is still
 * worth looking at. Archiving is filing; status is the outcome. A completed
 * engagement and a cancelled one are both finished and both get archived
 * eventually, and nobody wants to be told they are the same thing.
 */
export type WorkspaceStatus =
  | "ongoing"
  | "completed"
  | "unfinished-halted"
  | "cancelled";

/**
 * The statuses in the order a person reads them.
 *
 * Ordered by how far along the work is rather than alphabetically, because
 * this list is what the filter tabs and the status picker are built from and
 * those are read top to bottom.
 */
export const WORKSPACE_STATUSES: WorkspaceStatus[] = [
  "ongoing",
  "completed",
  "unfinished-halted",
  "cancelled",
];

/**
 * What each status is called on screen.
 *
 * "unfinished-halted" is the stored value and is not a phrase anyone says.
 * Deriving the label from it would print "Unfinished halted", which reads as
 * two words that were meant to be one thing and is exactly the sort of detail
 * that makes a product look unfinished itself.
 */
export const WORKSPACE_STATUS_LABELS: Record<WorkspaceStatus, string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  "unfinished-halted": "On hold",
  cancelled: "Cancelled",
};

/**
 * A sentence explaining what choosing a status means.
 *
 * Shown in the picker because the difference between cancelled and on hold is
 * a judgement about whether the work is coming back, and getting it wrong
 * leaves either a dead engagement that people keep chasing or a live one
 * nobody is watching.
 */
export const WORKSPACE_STATUS_DESCRIPTIONS: Record<WorkspaceStatus, string> = {
  ongoing: "Work is under way.",
  completed: "The engagement finished and was delivered.",
  "unfinished-halted": "Work stopped without finishing and may resume.",
  cancelled: "The engagement was called off and is not resuming.",
};

/**
 * The badge tone for each status.
 *
 * Cancelled is neutral rather than danger. Danger is for something wrong that
 * wants attention, and a cancelled engagement is a closed matter -- painting
 * it red would pull the eye down a list towards the rows least in need of it.
 * On hold is the warning, because that is the state where work is waiting on
 * somebody and nobody is being told.
 */
export const WORKSPACE_STATUS_TONES: Record<
  WorkspaceStatus,
  "neutral" | "info" | "success" | "warning" | "danger"
> = {
  ongoing: "info",
  completed: "success",
  "unfinished-halted": "warning",
  cancelled: "neutral",
};

/**
 * The status of a workspace, whatever the server sent.
 *
 * Records created before the field existed have no status. The API reports
 * those as ongoing, but this guards the case anyway: a blank would fall
 * through every comparison below and render as no badge at all, which reads as
 * a rendering fault rather than as old data.
 */
export function workspaceStatus(workspace: {
  status?: string;
}): WorkspaceStatus {
  const value = workspace.status as WorkspaceStatus | undefined;

  return value && WORKSPACE_STATUSES.includes(value) ? value : "ongoing";
}
