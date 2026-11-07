/**
 * What a resolved identifier turned out to name.
 *
 * The kind values match the backend's, and the client turns them into routes.
 * Adding one here without a matching case in the route builder produces a
 * result that displays and cannot be opened, so the two are kept together --
 * see `lookupRoute`.
 *
 * People arrive already split by role rather than as a single "user". The
 * client screen and the manager screen are different destinations, and a
 * result that only said "user" would leave this side either guessing or making
 * a second request purely to find out which one to open. "user" survives as
 * the answer for a role this build has not heard of.
 */
export type LookupKind =
  | "workspace"
  | "client"
  | "manager"
  | "admin"
  | "user"
  | "task"
  | "checklist"
  | "message"
  | "file"
  | "file_request"
  | "irs_submission"
  | "questionnaire"
  | "signature_request";

export type LookupResult = {
  id: string;

  kind: LookupKind;

  /** A short human description: a workspace name, a task title, the opening of a message. */
  label?: string;

  /** Absent for records that are not inside a workspace, which means workspaces and users. */
  workspace_id?: string;

  workspace_name?: string;
};
