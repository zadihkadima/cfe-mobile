import { useQuery } from "@tanstack/react-query";

import { getClient } from "@/modules/admin/api/client/api";

import { Client } from "@/modules/admin/api/client/types";

import { queryKeys } from "@/core/query/queryKeys";

export const useClient = (id: string) => {
  return useQuery<Client>({
    queryKey: queryKeys.clients.detail(id),

    queryFn: () => getClient(id),

    enabled: !!id,
  });
};