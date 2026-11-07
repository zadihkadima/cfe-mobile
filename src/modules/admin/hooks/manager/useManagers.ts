import { useQuery } from "@tanstack/react-query";

import { getManagers } from "@/modules/admin/api/manager/api";

import {
  ListManagersParams,
  ListManagersResponse,
} from "@/modules/admin/api/manager/types";

import { queryKeys } from "@/core/query/queryKeys";

export const useManagers = (
  params: ListManagersParams
) => {
  return useQuery<ListManagersResponse>({
    queryKey: queryKeys.managers.list(params),

    queryFn: () => getManagers(params),
  });
};