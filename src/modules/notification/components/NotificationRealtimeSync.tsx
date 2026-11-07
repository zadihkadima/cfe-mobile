import { useSelector } from "react-redux";

import { RootState } from "@/core/store";

import { useNotificationSocket } from "../hooks/useNotificationSocket";

/**
 * Keeps the realtime connection alive for as long as somebody is signed in.
 *
 * The signal comes from the store rather than from the token service, which is
 * what this component used to read. A token read during render is a snapshot,
 * and this component sits at the root of the navigator where it renders once --
 * before the session has finished restoring. The snapshot was therefore null,
 * the socket never opened, and notifications only appeared when something else
 * happened to refetch. Selecting from the store means this re-renders when the
 * session arrives, which is the moment there is something to connect with.
 */
export function NotificationRealtimeSync() {
  const signedIn = useSelector((state: RootState) => !!state.auth.user);

  useNotificationSocket(signedIn);

  return null;
}