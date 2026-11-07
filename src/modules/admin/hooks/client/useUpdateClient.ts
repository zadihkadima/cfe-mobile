import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { updateClient } from "@/modules/admin/api/client/api";

import {
  UpdateClientRequest,
} from "@/modules/admin/api/client/types";

import { queryKeys } from "@/core/query/queryKeys";

type UpdateClientVariables = {
  id: string;
  data: UpdateClientRequest;
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: UpdateClientVariables) =>
      updateClient(id, data),

    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.clients.all,
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.clients.detail(
          variables.id
        ),
      });
    },
  });
};