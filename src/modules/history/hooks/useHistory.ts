import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";

import {
  getHistory,
  HistoryEntry,
  HistoryParams,
  suggestPeople,
} from "../api/api";

/**
 * How many entries are fetched at a time.
 *
 * Small enough that the first screenful arrives quickly on a phone connection,
 * which matters because this is the landing state now rather than something an
 * administrator only reaches after searching.
 */
export const HISTORY_PAGE_SIZE = 25;

/**
 * The audit trail, paged.
 *
 * Infinite rather than numbered pages: the trail is append-only and read
 * newest-first, so "show me more" is the only navigation that means anything.
 * Page numbers would imply a stable, countable set, and the count is the one
 * thing the API deliberately does not compute.
 *
 * Not cached for long. An investigator refreshing this screen is usually doing
 * so because something is happening right now, and a stale answer is the one
 * result that would send them looking in the wrong place.
 */
export function useHistory(params: HistoryParams = {}) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.history.list(params),

    queryFn: ({ pageParam }) =>
      getHistory({ ...params, limit: HISTORY_PAGE_SIZE, offset: pageParam }),

    initialPageParam: 0,

    getNextPageParam: (last) =>
      last.has_more ? last.offset + last.items.length : undefined,

    staleTime: 15 * 1000,
  });

  // Flattened here rather than in the screen so the two places that render
  // entries cannot disagree about how pages are joined.
  const entries: HistoryEntry[] =
    query.data?.pages.flatMap((page) => page.items) ?? [];

  return { ...query, entries };
}

/**
 * People matching what has been typed so far.
 *
 * The caller is expected to pass an already-debounced term. Keeping the debounce
 * out here means the delay is visible next to the input it governs, rather than
 * buried in a hook where it would be tuned by someone who cannot see the field.
 *
 * Terms under two characters are not requested at all: one character matches
 * most of the firm, so the list would be long, useless, and asked for on nearly
 * every keystroke. The API refuses them too -- this only avoids the round trip.
 */
export function useSuggestedPeople(term: string) {
  const trimmed = term.trim();

  return useQuery({
    queryKey: queryKeys.history.suggest(trimmed),
    queryFn: () => suggestPeople(trimmed),
    enabled: trimmed.length >= 2,

    // Names and addresses barely change during one investigation, and this
    // runs while someone is typing.
    staleTime: 5 * 60 * 1000,
  });
}
