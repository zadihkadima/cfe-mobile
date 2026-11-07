import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { deleteManager } from "@/modules/admin/api/manager/api";

import { queryKeys } from "@/core/query/queryKeys";

export const useDeleteManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteManager(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.managers.all,
      });
    },
  });
};