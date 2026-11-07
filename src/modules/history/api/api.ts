import { api } from "@/core/api/client";

/**
 * One audited action. Mirrors audit.Entry in the backend.
 *
 * Every field is a record of what was attempted, not of what the system
 * believes now: the role is the role the token asserted at the time, because
 * roles change and the question is always what authority they held then.
 */
export interface HistoryEntry {
  actor_id?: string;
  actor_role?: string;
  action: string;
  method: string;
  path: string;
  resource?: Record<string, string>;
  workspace_id?: string;
  status: number;
  outcome: "success" | "denied" | "failure" | "rejected";
  request_id?: string;
  ip?: string;
  user_agent?: string;
  duration_ms: number;
  created_at: string;

  /**
   * What happened, in the language of the business: "task.updated",
   * "file_request.fulfilled". Absent on entries written before the backend
   * learned to name events, and on any route its catalogue does not yet cover.
   */
  event?: string;

  /**
   * The record the action was about. entity_id is absent for creations, since
   * the identifier is minted inside the handler and the audit middleware only
   * ever sees what the router matched.
   */
  entity_type?: string;
  entity_id?: string;

  /**
   * Session and badge upkeep -- token refreshes, read receipts, push device
   * registrations. The API excludes these unless they are asked for, so this
   * is normally false on everything the screen receives.
   */
  routine?: boolean;
}

export interface HistoryResponse {
  items: HistoryEntry[];

  /**
   * Whether another page exists.
   *
   * The API returns this instead of a total. Counting the trail means scanning
   * a collection that only grows, so the count would get slower every day the
   * system runs, to answer a question the screen never asks.
   */
  has_more: boolean;
  limit: number;
  offset: number;
}

/**
 * Someone the trail can be filtered by.
 *
 * Four fields, projected by the API. The suggestion list fires while an
 * administrator is typing, which is the least controlled surface in the
 * product, so nothing beyond what the picker draws is sent to it.
 */
export interface HistoryPerson {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Every filter is optional.
 *
 * An unfiltered request is the screen's landing state and returns the most
 * recent activity. It used to be refused, which left the page blank until the
 * investigator already knew an identifier to type -- backwards for a tool
 * whose purpose is to tell them what has been going on.
 */
export interface HistoryParams {
  actorId?: string;

  /**
   * An address. Resolved to an account by the API before the trail is read,
   * because entries store an actor id: addresses change, and the question is
   * always which account acted.
   */
  email?: string;

  workspaceId?: string;
  resourceId?: string;

  /**
   * One record's own story. Exact, unlike resourceId, which matches whatever
   * the route happened to call its parameter.
   */
  entityId?: string;

  /**
   * Ask for session and badge upkeep as well as work. Off by default, because
   * a screen in which every deletion is buried under a thousand token
   * refreshes is one nobody reads.
   */
  includeRoutine?: boolean;

  outcome?: string;
  limit?: number;
  offset?: number;
}

export const getHistory = async ({
  actorId,
  email,
  workspaceId,
  resourceId,
  entityId,
  includeRoutine,
  outcome,
  limit,
  offset,
}: HistoryParams): Promise<HistoryResponse> => {
  const res = await api.get<HistoryResponse>("/admin/history", {
    params: {
      actor_id: actorId || undefined,
      email: email || undefined,
      workspace_id: workspaceId || undefined,
      resource_id: resourceId || undefined,
      entity_id: entityId || undefined,
      include_routine: includeRoutine ? "true" : undefined,
      outcome: outcome || undefined,
      limit,
      offset: offset || undefined,
    },
  });

  return res.data;
};

export const suggestPeople = async (term: string): Promise<HistoryPerson[]> => {
  const res = await api.get<{ items: HistoryPerson[] }>(
    "/admin/history/suggest",
    { params: { q: term } }
  );

  return res.data.items ?? [];
};
