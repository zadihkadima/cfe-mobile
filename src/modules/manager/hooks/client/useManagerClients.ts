import { useQuery } from "@tanstack/react-query";

import { getManagerClients } from "@/modules/manager/api/client/api";

import {
  ListManagerClientsParams,
  ListManagerClientsResponse,
} from "@/modules/manager/api/client/types";

import { queryKeys } from "@/core/query/queryKeys";

export const useManagerClients = (
  params: ListManagerClientsParams
) => {
  return useQuery<ListManagerClientsResponse>({
    queryKey: queryKeys.managerClients.list(params),

    queryFn: () => getManagerClients(params),
  });
};
