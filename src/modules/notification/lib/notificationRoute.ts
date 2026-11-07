/**
 * Where a notification came from.
 *
 * Notifications and dashboard activity describe the same events and carry the
 * same fields, so the mapping lives here once rather than being written out at
 * each screen that lists them. Two copies of this would drift the first time a
 * new entity type was added to one list and not the other, and the symptom --
 * a row that does nothing when tapped -- looks like an unrelated bug in
 * whichever screen you happen to be on.
 */
export type RoutableEntity = {
  entity_type: string;
  entity_id: string;
  workspace_id?: string;

  /**
   * The event that produced this, such as "task.deleted".
   *
   * Optional because not every caller has one, but supplying it is what allows
   * a link to the individual record: a notification about a deleted task must
   * not open that task's edit screen.
   */
  type?: string;
};

/** Which tree of screens the reader is allowed to walk. */
export type ViewerRole = "admin" | "manager" | "client";

/**
 * The screens that show a workspace-scoped entity, keyed by the entity_type
 * the backend emits.
 *
 * Only types the backend actually sends are listed. The full set at the time
 * of writing is checklist, file_request, irs_submission, message,
 * questionnaire, signature_request, task and workspace_file; anything absent
 * from here has no screen of its own yet and lands on the workspace instead.
 */
const workspaceSections: Record<string, string> = {
  checklist: "checklists",
  file_request: "client-files",
  workspace_file: "client-files",
  irs_submission: "irs-submissions",
  message: "messages",
  questionnaire: "questionnaires",
  signature_request: "signatures",
  task: "tasks",
};

/**
 * Entity types that have a screen for one record, not just a list of them.
 *
 * Three of the eight do. The rest genuinely have nowhere deeper to go, and
 * inventing a route for them would land the reader on the not-found screen --
 * worse than the list they could have had.
 */
const recordPaths: Record<string, (id: string) => string> = {
  task: (id) => `tasks/${id}/edit`,
  checklist: (id) => `checklists/${id}/edit`,
  questionnaire: (id) => `questionnaires/${id}/answer`,
};

/**
 * Whether the record is gone by the time the row is read.
 *
 * A link to a deleted task would open an edit screen for something the server
 * will refuse to load. These stop at the list instead, which is a real
 * destination and also the place that shows the record is no longer there.
 */
function isDeletionEvent(type?: string): boolean {
  return Boolean(type?.endsWith(".deleted"));
}

/**
 * Resolve the route a notification or activity entry should open.
 *
 * Returns null when there is nowhere useful to go, so the caller can render
 * the row as plain text rather than as something that looks tappable. A row
 * that responds to a tap by staying put reads as a broken screen, and a row
 * that navigates to a route which does not exist reads as a broken app -- an
 * earlier version of this sent tasks and checklists to /user/tasks and
 * /user/checklists, neither of which is a route, so those notifications landed
 * on the not-found screen.
 *
 * The role decides which tree the workspace route is built in. Administrators
 * have their own set of workspace screens under /user/admin, and sending them
 * to the shared ones opened screens their own navigation never links to.
 */
export function resolveEntityRoute(
  entity: RoutableEntity,
  role: ViewerRole = "client",
): string | null {
  const {
    entity_type: entityType,
    entity_id: id,
    workspace_id: workspaceId,
  } = entity;

  const base =
    role === "admin" ? "/user/admin/workspaces" : "/user/workspaces";

  if (entityType === "workspace") {
    return id ? `${base}/${id}` : null;
  }

  // These screens exist only in the administrator's tree, and only an
  // administrator is ever notified about them.
  if (entityType === "manager") {
    return id ? `/user/admin/managers/${id}` : null;
  }

  if (entityType === "client") {
    return id ? `/user/admin/clients/${id}` : null;
  }

  const section = workspaceSections[entityType];

  if (!section) {
    // An entity type this build has never heard of. It is better to show the
    // notification and leave it inert than to guess a route, because a wrong
    // guess navigates away from the thing the user was reading.
    return workspaceId ? `${base}/${workspaceId}` : null;
  }

  if (!workspaceId) {
    // The section only exists inside a workspace, so without one there is no
    // route to build. Messages are the exception: they have a standalone
    // screen listing every conversation.
    return entityType === "message" ? "/user/messages" : null;
  }

  const recordPath = recordPaths[entityType];

  if (recordPath && id && !isDeletionEvent(entity.type)) {
    return `${base}/${workspaceId}/${recordPath(id)}`;
  }

  return `${base}/${workspaceId}/${section}`;
}
