import { api } from "@/core/api/client";

import { AppNotification, NotificationListResponse, UnreadSummary } from "./types";

/**
 * The general notification list: everything that is not conversation traffic.
 *
 * The scope is sent explicitly even though the server defaults to it, because
 * what this list leaves out is the whole point of it -- a reader here should
 * not have to go to the server to find out that messages are excluded.
 */
export async function getNotifications() {
  const { data } = await api.get<NotificationListResponse>("/notifications", {
    params: { scope: "general" },
  });

  return data;
}

/**
 * Every unread badge in the app, in one request.
 *
 * One call rather than one per badge: a workspace list draws a badge per row,
 * and twenty rows must not mean twenty requests.
 */
export async function getUnreadByWorkspace() {
  const { data } = await api.get<UnreadSummary>(
    "/notifications/unread-by-workspace",
  );

  return data;
}

/** Clear one workspace tab's badge, which is what opening that tab means. */
export async function markWorkspaceKindRead(
  workspaceId: string,
  kind: string,
) {
  await api.patch(`/workspaces/${workspaceId}/notifications/${kind}/read`);
}

export async function markNotificationRead(id: string) {
  await api.patch(`/notifications/${id}/read`);
}

/**
 * Flip one notification between read and unread.
 *
 * The server returns the notification as it now stands, so the caller can put
 * that straight into the cache instead of guessing at the new state.
 */
export async function toggleNotificationRead(id: string) {
  const { data } = await api.patch<AppNotification>(
    `/notifications/${id}/toggle`,
  );

  return data;
}

/**
 * Clear the general list.
 *
 * Scoped to match what the list showed. Unscoped, this would also mark every
 * unread message in every workspace as read, so tidying notifications would
 * wipe the badges that say where the unread conversation is -- from a button
 * that never mentions messages.
 */
export async function markAllNotificationsRead() {
  await api.patch("/notifications/read-all", null, {
    params: { scope: "general" },
  });
}