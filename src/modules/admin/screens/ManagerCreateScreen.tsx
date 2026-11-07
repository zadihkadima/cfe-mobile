import React from "react";

import {
  Text,
} from "react-native";
import { useDispatch } from "react-redux";

import { useRouter } from "expo-router";

import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";
import { ManagerForm } from "@/modules/admin/components/manager/ManagerForm";

import { useCreateManager } from "@/modules/admin/hooks/manager/useCreateManager";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { showError, showSuccess } from "@/core/store/notificationSlice";

export function ManagerCreateScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const createManager =
    useCreateManager();

  const onSubmit = (data: any) => {
    createManager.mutate(data, {
      onSuccess: () => {
        dispatch(showSuccess("Manager created successfully."));

        router.replace(
          "/user/admin/managers"
        );
      },

      onError: (error: any) => {
        const appError = normalizeApiError(error);
        dispatch(showError(appError.message));
      },
    });
  };

  return (
    <ScreenScrollView>
      <Text className="text-3xl font-bold text-text dark:text-dark-text mb-6">
        Create Manager
      </Text>

      <ManagerForm
        loading={
          createManager.isPending
        }
        submitText="Create Manager"
        onSubmit={onSubmit}
      />
    </ScreenScrollView>
  );
}