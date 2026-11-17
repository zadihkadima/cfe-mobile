import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { deleteManagerClient } from "@/modules/manager/api/client/api";

import { queryKeys } from "@/core/query/queryKeys";

export const useDeleteManagerClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteManagerClient(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.managerClients.all,
      });
    },
  });
};
