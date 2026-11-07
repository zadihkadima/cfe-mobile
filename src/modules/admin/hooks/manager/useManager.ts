import { useQuery } from "@tanstack/react-query";

import { getManager } from "@/modules/admin/api/manager/api";

import { Manager } from "@/modules/admin/api/manager/types";

import { queryKeys } from "@/core/query/queryKeys";

export const useManager = (id: string) => {
  return useQuery<Manager>({
    queryKey: queryKeys.managers.detail(id),

    queryFn: () => getManager(id),

    enabled: !!id,
  });
};