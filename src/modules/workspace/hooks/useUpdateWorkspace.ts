import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { store } from "@/core/store";
import { showError, showSuccess } from "@/core/store/notificationSlice";

import {
  updateWorkspace,
} from "@/modules/workspace/api/api";

import {
  UpdateWorkspaceRequest,
} from "@/modules/workspace/api/types";

export const useUpdateWorkspace = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: ({
      id,
      data,
    }: {
      id: string;

      data: UpdateWorkspaceRequest;
    }) =>
      updateWorkspace(
        id,
        data
      ),

    onSuccess: (
      _,
      variables,
    ) => {

      void queryClient.invalidateQueries({
        queryKey:
          queryKeys.workspaces.all,
      });

      void queryClient.invalidateQueries({
        queryKey:
          queryKeys.workspaces.detail(
            variables.id
          ),
      });

      store.dispatch(
        showSuccess("Workspace updated successfully."),
      );
    },

    onError: (error: unknown) => {
      const appError = normalizeApiError(error);
      store.dispatch(showError(appError.message));
    },
  });
};