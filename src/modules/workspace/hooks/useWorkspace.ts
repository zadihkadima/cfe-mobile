import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";

import {
  getWorkspace,
} from "@/modules/workspace/api/api";

export const useWorkspace = (
  id: string
) => {
  return useQuery({
    queryKey:
      queryKeys.workspaces.detail(id),

    queryFn: () =>
      getWorkspace(id),

    enabled: !!id,
  });
};