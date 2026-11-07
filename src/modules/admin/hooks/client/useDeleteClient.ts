import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { deleteClient } from "@/modules/admin/api/client/api";

import { queryKeys } from "@/core/query/queryKeys";

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteClient(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.clients.all,
      });
    },
  });
};