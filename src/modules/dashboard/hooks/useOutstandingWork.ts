import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";

import { getOutstandingWork } from "../api/api";

/**
 * Outstanding work for the signed-in person.
 *
 * Deliberately short-lived in the cache. Unlike workspace membership, this is
 * the answer to "what needs doing right now"; showing a task someone completed
 * two minutes ago is the specific failure this screen exists to avoid.
 */
export function useOutstandingWork(limit?: number) {
  return useQuery({
    queryKey: queryKeys.dashboard.outstanding(limit),
    queryFn: () => getOutstandingWork(limit),
    staleTime: 30 * 1000,
  });
}
