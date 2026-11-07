import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";
import { lookupById } from "@/modules/admin/api/lookup/api";
import { LookupResult } from "@/modules/admin/api/lookup/types";

/**
 * Resolves an identifier to whatever it names.
 *
 * Disabled until the id looks like one. An ObjectID is twenty-four hex
 * characters, and a half-typed or half-pasted value is not worth a round trip
 * -- every keystroke would otherwise send a request that walks ten collections
 * to answer "no", and the answer that matters would arrive behind a queue of
 * them.
 *
 * Resolving to null is a settled answer rather than an error, so it is cached
 * like any other. Retrying is switched off for the same reason: nothing about
 * a search that found nothing improves by asking twice.
 */
export const useLookup = (id: string) => {
  const trimmed = id.trim();

  return useQuery<LookupResult | null>({
    queryKey: queryKeys.lookup.detail(trimmed),

    queryFn: () => lookupById(trimmed),

    enabled: isLookupCandidate(trimmed),

    retry: false,
  });
};

/**
 * Whether a value is shaped like an identifier the server could resolve.
 *
 * Checked here rather than left to the server so that typing does not
 * generate a request per character. The server checks it too -- this is a
 * convenience, not a guard.
 */
export function isLookupCandidate(value: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(value.trim());
}
