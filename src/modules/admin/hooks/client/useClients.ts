import { useQuery } from "@tanstack/react-query";

import { getClients } from "@/modules/admin/api/client/api";

import {
  ListClientsParams,
  ListClientsResponse,
} from "@/modules/admin/api/client/types";

import { queryKeys } from "@/core/query/queryKeys";

export const useClients = (
  params: ListClientsParams
) => {
  return useQuery<ListClientsResponse>({
    queryKey: queryKeys.clients.list(params),

    queryFn: () => getClients(params),
  });
};