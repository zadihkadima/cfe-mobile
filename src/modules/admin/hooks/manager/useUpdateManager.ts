import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { updateManager } from "@/modules/admin/api/manager/api";

import {
  UpdateManagerRequest,
} from "@/modules/admin/api/manager/types";

import { queryKeys } from "@/core/query/queryKeys";

type UpdateManagerVariables = {
  id: string;
  data: UpdateManagerRequest;
};

export const useUpdateManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: UpdateManagerVariables) =>
      updateManager(id, data),

    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.managers.all,
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.managers.detail(
          variables.id
        ),
      });
    },
  });
};