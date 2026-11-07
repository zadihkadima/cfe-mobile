import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { createManager } from "@/modules/admin/api/manager/api";

import { CreateManagerRequest } from "@/modules/admin/api/manager/types";

import { queryKeys } from "@/core/query/queryKeys";

export const useCreateManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateManagerRequest) =>
      createManager(data),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.managers.all,
      });
    },
  });
};