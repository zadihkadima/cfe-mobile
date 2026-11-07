import { normalizeApiError } from "@/core/errors/normalizeApiError";

/**
 * Turns a failed upload into something the user can act on.
 *
 * "That file could not be uploaded" is the least useful sentence available: it
 * leaves somebody re-picking the same file and getting the same result. The
 * server distinguishes a file that is too large, one that failed a security
 * scan, one whose format is refused, and a scanner that is temporarily down —
 * and only the last of those is worth retrying unchanged.
 */
export function describeUploadFailure(error: unknown): string {
  const normalized = normalizeApiError(error);

  switch (normalized.status) {
    case 413:
      return "That file is too large to send.";

    case 422:
      // Covers both a refused format and a failed scan. The server states
      // which, and deliberately never names the threat it matched: that is
      // the one detail useful to somebody trying to get past it.
      return normalized.message || "That file was rejected.";

    case 503:
      // Nothing is wrong with the file, so the advice is to wait rather than
      // to change anything.
      return "Uploads are temporarily unavailable. Try again in a moment.";

    default:
      return "That file could not be uploaded. Try again.";
  }
}
