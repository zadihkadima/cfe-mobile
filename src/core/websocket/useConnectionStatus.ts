import { useEffect, useState } from "react";

import {
  ConnectionStatus,
  websocketClient,
} from "@/core/websocket/client";

/**
 * Reports whether the realtime connection is up.
 *
 * The socket was previously invisible: it connected, failed, or sat inert with
 * nothing on screen either way. A message sent while it was down was queued
 * silently and looked identical to one that had been delivered, so the only
 * symptom of a broken connection was messages that never seemed to arrive.
 */
export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    websocketClient.getStatus(),
  );

  useEffect(() => websocketClient.observeStatus(setStatus), []);

  return status;
}
