import { LookupKind } from "@/modules/admin/api/lookup/types";

import { HistoryEntry } from "../api/api";

/**
 * Turns an audited request into a sentence about what somebody did.
 *
 * The trail stores a route template -- "PATCH /api/v1/workspaces/:id/tasks/:task_id"
 * -- which is the right thing to store, because it is low cardinality and can
 * be grouped and indexed. It is not, however, something to put in front of an
 * administrator. The previous version of this screen took the last segment of
 * the template as the noun, which meant almost every row read "Updated :id":
 * the last segment of a template is nearly always the parameter, so the one
 * word meant to say what had been touched was the one word carrying no
 * information at all.
 *
 * The phrasing lives here rather than in the database on purpose. Wording gets
 * revised; a sentence written into every historical record cannot be. Keeping
 * it on this side means the trail stays a record of what happened and this
 * file stays a record of how we say it.
 */

/**
 * What each collection is called in a sentence, singular.
 *
 * The plural in the URL is a fact about the route, not about the record, and
 * "Deleted tasks" for one task is the kind of wrong that makes a reader stop
 * and re-count.
 */
const NOUNS: Record<string, string> = {
  workspaces: "workspace",
  clients: "client",
  managers: "manager",
  users: "account",
  tasks: "task",
  checklists: "checklist",
  questionnaires: "questionnaire",
  messages: "message",
  files: "file",
  "file-requests": "file request",
  "signature-requests": "signature request",
  "irs-submissions": "IRS submission",
  notifications: "notification",
  sessions: "session",
  firm: "firm settings",
  pin: "workspace pin",
  "two-factor": "two-factor authentication",
};

/**
 * Which record a collection resolves to when the row is opened.
 *
 * Reusing the lookup's kinds rather than inventing a second vocabulary, so a
 * row in the trail and a result from the search agree about where a task
 * lives.
 */
const KINDS: Record<string, LookupKind> = {
  workspaces: "workspace",
  clients: "client",
  managers: "manager",
  tasks: "task",
  checklists: "checklist",
  questionnaires: "questionnaire",
  messages: "message",
  files: "file",
  "file-requests": "file_request",
  "signature-requests": "signature_request",
  "irs-submissions": "irs_submission",
};

/**
 * The same mapping, keyed by the entity type the backend now names directly.
 *
 * Preferred over reading the route template whenever it is present. The
 * template has to be parsed, and parsing guesses: it reads the innermost
 * collection and hopes the route was shaped the way the rule assumes. The
 * entity type is a statement rather than an inference, so it is right even for
 * a route whose shape the rule was never designed for.
 *
 * "user" is deliberately absent. An account row is a client or a manager
 * depending on which route created it, a distinction the entity type does not
 * carry, so those rows fall through to the template where the answer is
 * spelled out in the path.
 */
const ENTITY_KINDS: Record<string, LookupKind> = {
  workspace: "workspace",
  task: "task",
  checklist: "checklist",
  questionnaire: "questionnaire",
  message: "message",
  workspace_file: "file",
  file_request: "file_request",
  signature_request: "signature_request",
  irs_submission: "irs_submission",
};

/**
 * Actions that are not create, update or delete.
 *
 * Written out by template because each is a distinct thing a person did, and
 * the method alone gets them all wrong: a POST that fulfils a file request is
 * not "Created fulfil", and a PATCH that marks messages read is not "Updated
 * read". Both are what the generic rule below would produce.
 */
const PHRASES: Record<string, string> = {
  "POST /auth/login": "Signed in",
  "POST /auth/logout": "Signed out",
  "POST /auth/refresh": "Renewed their session",
  "POST /auth/accept-invite": "Accepted their invitation",
  "POST /auth/forgot-password": "Asked for a password reset",
  "POST /auth/reset-password": "Reset their password",
  "POST /auth/two-factor/verify": "Completed two-factor authentication",
  "POST /auth/two-factor/resend": "Asked for a new two-factor code",
  "PATCH /auth/two-factor": "Changed two-factor authentication",
  "PATCH /auth/me": "Updated their profile",
  "POST /auth/sessions/revoke-all": "Signed out every other device",
  "DELETE /auth/sessions/:id": "Signed out a device",
  "POST /admin/users/:id/unlock": "Unlocked an account",
  "POST /admin/users/:id/resend-invite": "Resent an invitation",
  "PATCH /admin/firm": "Updated firm settings",
  "POST /workspaces/:id/files/upload": "Uploaded a file",
  "POST /workspaces/:id/files/:file_id/reupload": "Replaced a file",
  "POST /workspaces/:id/file-requests/:file_request_id/fulfil": "Fulfilled a file request",
  "PATCH /workspaces/:id/messages/read": "Marked messages read",
  "PATCH /workspaces/:id/notifications/:kind/read": "Marked notifications read",
  "PATCH /notifications/read-all": "Marked all notifications read",
  "PATCH /notifications/:id/read": "Marked a notification read",
  "PUT /workspaces/:id/pin": "Set the workspace PIN",
  "DELETE /workspaces/:id/pin": "Removed the workspace PIN",
};

const VERBS: Record<string, string> = {
  POST: "Created",
  PATCH: "Updated",
  PUT: "Replaced",
  DELETE: "Deleted",
  GET: "Viewed",
};

/** The template with the version prefix removed, which carries no meaning here. */
function template(entry: HistoryEntry): string {
  const [method, path = ""] = entry.action.split(" ");

  return `${method} ${path.replace(/^\/api\/v\d+/, "")}`;
}

/** Path segments of the template, parameters included, empties dropped. */
function segments(entry: HistoryEntry): string[] {
  return template(entry).split(" ")[1]?.split("/").filter(Boolean) ?? [];
}

/**
 * The collection acted on: the last segment that is a name rather than a
 * parameter.
 *
 * Read from the end because routes nest, and the innermost collection is the
 * one the action was about. A task under a workspace is a task; saying
 * "workspace" because that came first would file every nested action under the
 * container instead of the thing.
 */
function collection(entry: HistoryEntry): string | undefined {
  return segments(entry)
    .filter((segment) => !segment.startsWith(":"))
    .pop();
}

export function describeAction(entry: HistoryEntry): string {
  const phrase = PHRASES[template(entry)];

  if (phrase) return phrase;

  const verb = VERBS[entry.method] ?? entry.method;
  const noun = NOUNS[collection(entry) ?? ""];

  // A route this build has not been taught still has to render as something
  // legible. The concrete path is the honest fallback: it says less than a
  // sentence would, but it never says anything untrue.
  if (!noun) return `${verb} ${entry.path}`;

  return `${verb} ${noun}`;
}

/**
 * Where the row happened, or null when there is nowhere to send anyone.
 *
 * Built from the route parameters the trail already stores rather than from
 * the concrete path, because the path is what the API answered on and the
 * screens are somewhere else entirely.
 *
 * Null is a real answer. Signing in happened at no record; a deleted task has
 * nothing left to open. A link that navigates to an empty screen is worse than
 * a row that does not offer one, because the reader blames the record rather
 * than the link.
 */
export function historyRoute(entry: HistoryEntry): string | null {
  const kind = entryKind(entry);

  if (!kind) return null;

  const resource = entry.resource ?? {};

  const workspace = entry.workspace_id ?? resource.id;

  switch (kind) {
    case "workspace":
      return workspace ? `/user/admin/workspaces/${workspace}` : null;

    case "client":
      return resource.id ? `/user/admin/clients/${resource.id}` : null;

    case "manager":
      return resource.id ? `/user/admin/managers/${resource.id}` : null;

    default:
      // Everything else lives inside a workspace and is reached through the tab
      // that lists it. There is no detail screen for a single task or message
      // to open, and the tab is where the reader was heading anyway.
      return workspace ? `/user/admin/workspaces/${workspace}/${TABS[kind]}` : null;
  }
}

/** The workspace tab that lists each kind. */
const TABS: Record<string, string> = {
  task: "tasks",
  checklist: "checklists",
  questionnaire: "questionnaires",
  message: "messages",
  file: "client-files",
  file_request: "client-files",
  signature_request: "signatures",
  irs_submission: "irs-submissions",
};

/**
 * The kind of record a row concerns, for filtering.
 *
 * Undefined for rows that are not about a record at all -- signing in, asking
 * for a password reset. Those are real activity and stay in the unfiltered
 * trail; they simply belong under no heading.
 */
export function entryKind(entry: HistoryEntry): LookupKind | undefined {
  const named = ENTITY_KINDS[entry.entity_type ?? ""];

  // The template is still consulted, and not only for older entries: account
  // rows are typed as "user" by the backend and only the path says whether the
  // account was a client or a manager.
  return named ?? KINDS[collection(entry) ?? ""];
}
