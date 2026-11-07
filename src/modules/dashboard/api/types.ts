/**
 * The dashboard read model.
 *
 * Mirrors internal/dashboard/dto.go. This is the one endpoint that spans every
 * workspace the signed-in person belongs to, so it takes no workspace id: the
 * scope comes from the token.
 */

/** Which module a row came from. Matches dashboard.Kind on the server. */
export type OutstandingKind = "task" | "checklist" | "file_request" | "signature_request";

export interface OutstandingItem {
  id: string;
  kind: OutstandingKind;
  workspace_id: string;
  title: string;
  status: string;
  start_at?: string;
  due_at?: string;
  assigned_to?: string;
  /**
   * Computed on the server. The client cannot derive this correctly for an
   * administrator, who sees other people's work alongside their own.
   */
  assigned_to_me: boolean;
}

export interface OutstandingWorkResponse {
  items: OutstandingItem[];
  /**
   * Counts cover everything outstanding, not just the truncated page, so they
   * cannot be recomputed from `items`.
   */
  overdue: number;
  due_soon: number;
  assigned_to_me: number;
}
