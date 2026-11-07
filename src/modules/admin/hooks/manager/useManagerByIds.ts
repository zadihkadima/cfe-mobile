import { useQueries } from "@tanstack/react-query";

import {
  getManager,
} from "@/modules/admin/api/manager/api";

import { queryKeys } from "@/core/query/queryKeys";

export function useManagersByIds(
  ids: string[]
) {

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey:
        queryKeys.managers.detail(id),

      queryFn: () =>
        getManager(id),

      enabled: !!id,
    })),
  });

  return {
    data: queries
      .filter((q) => q.data)
      .map((q) => q.data!),

    isLoading:
      queries.some(
        (q) => q.isLoading
      ),
  };
}