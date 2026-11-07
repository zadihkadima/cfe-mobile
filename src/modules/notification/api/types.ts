/**
 * The person whose action produced a notification.
 *
 * Optional because the account may have been deleted since, in which case the
 * event still happened and is still worth showing -- unattributed rather than
 * withheld.
 */
export type NotificationActor = {
  id: string;
  name: string;
  avatar_url?: string;
};

export type AppNotification = {
  id: string;
  workspace_id?: string;

  /**
   * Which engagement this happened in, absent when the notification is not
   * workspace-scoped or the workspace has been deleted.
   *
   * Sent alongside the id rather than instead of it: the id is what a route is
   * built from, and the name is what a reader is shown.
   */
  workspace_name?: string;

  type: string;
  title: string;
  body: string;
  entity_type: string;
  entity_id: string;
  read_at?: string;
  created_at: string;
  actor?: NotificationActor;
};

export type NotificationListResponse = {
  items: AppNotification[];
  total: number;
  unread: number;
};

/**
 * The kinds a badge can be drawn for. These match the workspace tab keys, so a
 * tab can look up its own number directly.
 *
 * "other" is the bucket the server files anything it does not recognise into,
 * so a new kind still reaches the workspace total rather than disappearing.
 */
export const UNREAD_KINDS = [
  "message",
  "task",
  "checklist",
  "file_request",
  "signature_request",
  "workspace_file",
  "questionnaire",
  "irs_submission",
  "other",
] as const;

export type UnreadKind = (typeof UNREAD_KINDS)[number];

export type UnreadWorkspace = {
  workspace_id: string;
  total: number;
  by_kind: Partial<Record<UnreadKind, number>>;
};

export type UnreadSummary = {
  items: UnreadWorkspace[];
  total: number;
  by_kind: Partial<Record<UnreadKind, number>>;
};