import { useMutation } from "@tanstack/react-query";

import { createClient } from "../api/user.api";
import { CreateUserRequest } from "../types";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { store } from "@/core/store";
import { showError, showSuccess } from "@/core/store/notificationSlice";

export const useCreateClient = () => {
  return useMutation({
    mutationFn: async (
      data: CreateUserRequest
    ) => {
      const res = await createClient(data);
      return res.data;
    },

    onSuccess: () => {
      store.dispatch(showSuccess("Client created successfully."));
    },

    onError: (error: unknown) => {
      const appError = normalizeApiError(error);
      store.dispatch(showError(appError.message));
    },
  });
};