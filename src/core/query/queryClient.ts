import { QueryClient } from "@tanstack/react-query";

import { normalizeApiError } from "@/core/errors/normalizeApiError";

/**
 * Statuses that will never succeed on retry.
 *
 * Retrying these is not merely wasteful, it is harmful: repeating a request
 * that was rejected for authorisation multiplies the load a locked-out or
 * hostile client puts on the API and burns the caller's rate-limit budget, so a
 * user who hits one genuine 403 can find every subsequent request throttled.
 */
const TERMINAL_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429]);

const MAX_RETRIES = 2;

/**
 * Exported for testing. The retry rule is the difference between one rejected
 * request and three, so it is worth asserting directly rather than inferring
 * from behaviour at a distance.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) {
    return false;
  }

  const { code, status } = normalizeApiError(error);

  if (code === "ACCOUNT_LOCKED") {
    return false;
  }

  // A missing status means the request never reached the server, which is the
  // transient case retrying is actually for: a dropped connection, a tunnel
  // switching networks, a device waking from sleep.
  if (status === undefined) {
    return true;
  }

  return !TERMINAL_STATUSES.has(status);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,

      // Exponential backoff with a ceiling. Retrying immediately tends to hit
      // the same congestion or the same cold dependency that caused the first
      // failure, and a fleet of clients doing so in lockstep turns a brief
      // outage into a sustained one.
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),

      // Mobile screens are revisited constantly through tab and stack
      // navigation. Without a stale window, every visit refetches, which on a
      // metered or weak connection is both slow and expensive for the user.
      staleTime: 30_000,

      // Retained briefly after unmount so navigating back renders instantly
      // from cache while any refresh happens behind the scenes.
      gcTime: 5 * 60_000,

      // A device that regains signal should reconcile rather than keep showing
      // data from before the gap.
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },

    mutations: {
      // Mutations are never retried automatically. A retried POST that actually
      // succeeded but whose response was lost would create a duplicate record;
      // the safe way to retry a mutation is with an Idempotency-Key, under
      // explicit control of the caller. See src/core/api/idempotency.ts.
      retry: false,
    },
  },
});