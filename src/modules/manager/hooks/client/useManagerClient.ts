import { useQuery } from "@tanstack/react-query";

import { getManagerClient } from "@/modules/manager/api/client/api";

import { ManagerClient } from "@/modules/manager/api/client/types";

import { queryKeys } from "@/core/query/queryKeys";

export const useManagerClient = (id: string) => {
  return useQuery<ManagerClient>({
    queryKey: queryKeys.managerClients.detail(id),

    queryFn: () => getManagerClient(id),

    enabled: !!id,
  });
};
