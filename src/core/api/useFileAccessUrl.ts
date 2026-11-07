import { useQuery } from "@tanstack/react-query";

import {
  getWorkspaceFileAccess,
  WorkspaceFileAccess,
} from "@/core/api/uploadWorkspaceFile";

/**
 * How long before expiry a URL is treated as needing replacement.
 *
 * A URL fetched and used in the same instant is fine; one already on screen is
 * not, because the image behind it may not have loaded yet, or may be reloaded
 * by the list recycling its rows. Renewing early costs one request and avoids
 * an image that was visible a moment ago turning into a broken box.
 */
const RENEW_MARGIN_MS = 60_000;

/**
 * Holds a currently-valid URL for a stored file.
 *
 * Access URLs are short-lived by design, which makes them wrong to keep. The
 * obvious approach — fetch once when the row mounts — works for exactly as
 * long as the URL lasts and then fails silently in the one situation that
 * matters most: a conversation left open. This refetches before expiry so an
 * image that has been on screen for an hour is still an image.
 *
 * The lifetime is read from the response rather than assumed, so changing it
 * on the server does not require changing it here as well.
 */
export function useFileAccessUrl(
  workspaceId: string,
  fileId: string | undefined,
  enabled = true,
) {
  return useQuery<WorkspaceFileAccess>({
    queryKey: ["file-access-url", workspaceId, fileId],

    queryFn: () => getWorkspaceFileAccess(workspaceId, fileId as string),

    enabled: enabled && !!fileId,

    // Derived from the expiry the server reported. Falling back to a minute
    // when it cannot be read means an unreadable response costs an extra
    // request rather than leaving a URL cached past the point it works.
    staleTime: (query) => {
      const expiresAt = query.state.data?.expiresAt;

      if (!expiresAt) {
        return 60_000;
      }

      const remaining = new Date(expiresAt).getTime() - Date.now();

      return Number.isFinite(remaining)
        ? Math.max(0, remaining - RENEW_MARGIN_MS)
        : 60_000;
    },

    // A URL that has expired is not worth showing while a fresh one loads,
    // and keeping it would put a broken image on screen.
    gcTime: 0,

    retry: 1,
  });
}
