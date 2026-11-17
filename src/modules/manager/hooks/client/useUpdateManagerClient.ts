import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { updateManagerClient } from "@/modules/manager/api/client/api";

import {
  UpdateManagerClientRequest,
} from "@/modules/manager/api/client/types";

import { queryKeys } from "@/core/query/queryKeys";

type UpdateManagerClientVariables = {
  id: string;
  data: UpdateManagerClientRequest;
};

export const useUpdateManagerClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: UpdateManagerClientVariables) =>
      updateManagerClient(id, data),

    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.managerClients.all,
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.managerClients.detail(
          variables.id
        ),
      });
    },
  });
};
