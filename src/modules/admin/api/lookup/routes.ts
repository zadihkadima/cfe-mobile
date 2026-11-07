import { LookupKind, LookupResult } from "./types";

/**
 * What each kind is called on screen.
 *
 * Written out rather than derived from the value by replacing underscores and
 * capitalising, because the derived version produces "Irs Submission" and
 * "File Request", and the difference between a label a person wrote and a
 * label a regex produced is exactly the difference an administrator notices.
 */
export const LOOKUP_KIND_LABELS: Record<LookupKind, string> = {
  workspace: "Workspace",
  client: "Client",
  manager: "Manager",
  admin: "Administrator",
  user: "Person",
  task: "Task",
  checklist: "Checklist",
  message: "Message",
  file: "File",
  file_request: "File request",
  irs_submission: "IRS submission",
  questionnaire: "Questionnaire",
  signature_request: "Signature request",
};

/**
 * Where tapping a result should go, or null when there is nowhere to go.
 *
 * Returning null is a real answer, not a gap. Two kinds have no screen of
 * their own: an administrator has no profile page, and a record whose role
 * this build does not recognise has no page by definition. The screen shows
 * those results and does not make them tappable, which is honest about what
 * it found. Inventing a destination for them would send an administrator to
 * a route that renders nothing and looks like a bug in the search.
 *
 * Records that live inside a workspace need the workspace to build a path, so
 * one arriving without a workspace id also gets null. That should not happen
 * -- the server attaches it -- but a missing scope silently rendered as
 * `/workspaces/undefined/tasks` is worse than an untappable row.
 */
export function lookupRoute(result: LookupResult): string | null {
  const workspace = result.workspace_id;

  switch (result.kind) {
    case "workspace":
      return `/user/admin/workspaces/${result.id}`;

    case "client":
      return `/user/admin/clients/${result.id}`;

    case "manager":
      return `/user/admin/managers/${result.id}`;

    case "admin":
    case "user":
      return null;

    // The rest land on the workspace tab that holds the record rather than on
    // the record itself. There is no detail screen for a single task or
    // message to open, and the tab is where an administrator would have gone
    // looking anyway -- the search has saved them the part that was hard,
    // which was working out which workspace it was in.
    case "task":
      return workspace ? `/user/admin/workspaces/${workspace}/tasks` : null;

    case "checklist":
      return workspace ? `/user/admin/workspaces/${workspace}/checklists` : null;

    case "message":
      return workspace ? `/user/admin/workspaces/${workspace}/messages` : null;

    case "file":
    case "file_request":
      return workspace ? `/user/admin/workspaces/${workspace}/client-files` : null;

    case "irs_submission":
      return workspace ? `/user/admin/workspaces/${workspace}/irs-submissions` : null;

    case "questionnaire":
      return workspace ? `/user/admin/workspaces/${workspace}/questionnaires` : null;

    case "signature_request":
      return workspace ? `/user/admin/workspaces/${workspace}/signatures` : null;

    default:
      // Unreachable while the union and this switch agree. The assignment is
      // what enforces that: adding a kind to the union without a case here
      // fails to compile, so the failure lands on whoever added it rather
      // than on an administrator holding an id nothing responds to.
      return assertNever(result.kind);
  }
}

function assertNever(kind: never): null {
  void kind;

  return null;
}
