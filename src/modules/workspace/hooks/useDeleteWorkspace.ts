import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { store } from "@/core/store";
import { showError, showSuccess } from "@/core/store/notificationSlice";

import {
  deleteWorkspace,
} from "@/modules/workspace/api/api";

export const useDeleteWorkspace = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: deleteWorkspace,

    onSuccess: () => {

      void queryClient.invalidateQueries({
        queryKey:
          queryKeys.workspaces.all,
      });

      store.dispatch(
        showSuccess("Workspace deleted successfully."),
      );
    },

    onError: (error: unknown) => {
      const appError = normalizeApiError(error);
      store.dispatch(showError(appError.message));
    },
  });
};