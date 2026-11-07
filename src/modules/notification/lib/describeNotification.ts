import { AppNotification } from "../api/types";

/**
 * Turns a notification into a sentence about a person.
 *
 * The server sends a type, a title and a body. The title is written in the
 * passive voice -- "Task updated", "New file upload request", "Signed file
 * uploaded" -- which is the right thing to store, because it does not depend
 * on who is reading it and does not go stale when somebody is renamed. It is
 * not, however, what a reader wants. A screenful of those lines reports that
 * things happened without saying who did any of them, and the actor is usually
 * the first thing somebody wants to know and often the only thing that decides
 * whether an entry is worth opening.
 *
 * So the wording is assembled here, from the type and the actor the server now
 * resolves, rather than read out of the stored title. Wording gets revised;
 * a sentence written into every historical record cannot be.
 *
 * The stored title remains the fallback. A type this file has not been taught
 * still renders as something a person can read, which matters because the
 * server can raise a new kind of event before the app knows the word for it.
 */

/** What the actor did, phrased to follow a name. */
const VERBS: Record<string, string> = {
  "task.created": "added the task",
  "task.updated": "updated the task",
  "task.completed": "completed the task",
  "task.deleted": "deleted the task",

  "checklist.created": "added the checklist",
  "checklist.updated": "updated the checklist",
  "checklist.completed": "completed the checklist",
  "checklist.deleted": "deleted the checklist",

  "questionnaire.created": "added the questionnaire",
  "questionnaire.completed": "completed the questionnaire",
  "questionnaire.deleted": "deleted the questionnaire",

  "file_request.created": "requested",
  "file_request.fulfilled": "answered the request for",
  "file_request.deleted": "withdrew the request for",

  "signature_request.created": "asked for a signature on",
  "signature_request.file_uploaded": "uploaded the signed",
  "signature_request.deleted": "withdrew the signature request for",

  "irs_submission.created": "started the IRS submission",
  "irs_submission.file_uploaded": "attached a file to the IRS submission",
  "irs_submission.deleted": "deleted the IRS submission",

  "workspace_file.renamed": "renamed",
  "workspace_file.deleted": "deleted",

  "message.created": "sent a message",
};

/**
 * Types that were addressed to the reader personally rather than to the
 * workspace at large.
 *
 * Phrased with "you" because that is the distinction the notification is
 * making: everyone in the workspace hears that a task was created, but only
 * one person is being told they now own it, and a row that reads the same in
 * both cases loses the only part that required their attention.
 */
const DIRECTED: Record<string, string> = {
  "task.assigned": "assigned you the task",
};

export type NotificationSentence = {
  /** Who acted, or an empty string when the account could not be resolved. */
  actor: string;

  /** What they did, and to what. Always non-empty. */
  action: string;

  /**
   * Which engagement it happened in, or an empty string when the notification
   * is not workspace-scoped.
   *
   * Returned separately rather than concatenated into `action` so a view can
   * give it its own weight -- it is the part a reader scans for when deciding
   * whether a row concerns them at all.
   */
  workspace: string;

  /**
   * True when the reader is the object of the sentence, not a bystander.
   * The row uses this to mark entries that are actually about them.
   */
  directed: boolean;
};

export function describeNotification(
  notification: AppNotification,
): NotificationSentence {
  const actor = notification.actor?.name?.trim() ?? "";
  const subject = notification.body?.trim() ?? "";
  const workspace = notification.workspace_name?.trim() ?? "";

  const directedVerb = DIRECTED[notification.type];
  const verb = directedVerb ?? VERBS[notification.type];

  /*
   * Unknown type, or nobody to attribute it to.
   *
   * Falling back to the stored title rather than assembling half a sentence:
   * "updated the task Quarterly filing" with no name in front of it reads as
   * a bug, whereas "Task updated" reads as deliberate -- which it was, for
   * every notification this app has ever shown.
   */
  if (!verb || !actor) {
    return {
      actor: "",
      action: subject
        ? `${notification.title} — ${subject}`
        : notification.title,
      workspace,
      directed: Boolean(directedVerb),
    };
  }

  return {
    actor,
    // The subject is quoted so a title containing ordinary words does not run
    // into the verb: `renamed 2023 return` versus `renamed "2023 return"`.
    action: subject ? `${verb} “${subject}”` : verb,
    workspace,
    directed: Boolean(directedVerb),
  };
}
