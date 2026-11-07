import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { store } from "@/core/store";
import { showError, showSuccess } from "@/core/store/notificationSlice";

import {
  createWorkspace,
} from "@/modules/workspace/api/api";

export const useCreateWorkspace = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: createWorkspace,

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey:
          queryKeys.workspaces.all,
      });

      store.dispatch(
        showSuccess("Workspace created successfully."),
      );
    },

    onError: (error: unknown) => {
      const appError = normalizeApiError(error);
      store.dispatch(showError(appError.message));
    },
  });
};