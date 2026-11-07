import React from "react";

import { View, Text } from "react-native";
import { useDispatch } from "react-redux";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { ManagerForm } from "@/modules/admin/components/manager/ManagerForm";

import { useManager } from "@/modules/admin/hooks/manager/useManager";
import { useUpdateManager } from "@/modules/admin/hooks/manager/useUpdateManager";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { showError, showSuccess } from "@/core/store/notificationSlice";
import { QueryState } from "@/core/components/QueryState";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

export function ManagerEditScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const router = useRouter();
  const dispatch = useDispatch();

  const manager =
    useManager(id);

  const update =
    useUpdateManager();

  if (manager.isLoading || manager.isError) {
    return (
      <View className="flex-1 p-5 bg-background dark:bg-dark-background">
        <QueryState
          isLoading={manager.isLoading}
          isError={manager.isError}
          error={manager.error}
          onRetry={manager.refetch}
        />
      </View>
    );
  }

  if (!manager.data) {
    return (
      <View className="flex-1 justify-center items-center bg-background dark:bg-dark-background">
        <Text className="text-text dark:text-dark-text">Manager not found.</Text>
      </View>
    );
  }

  return (
    <ScreenScrollView>
      <Text className="text-3xl font-bold text-text dark:text-dark-text mb-6">
        Edit Manager
      </Text>

      <ManagerForm
        defaultValues={{
          first_name: manager.data.first_name,
          last_name: manager.data.last_name,
          email: manager.data.email,
        }}

        loading={update.isPending}

        submitText="Update Manager"

        onSubmit={(data) =>
          update.mutate(
            {
              id,
              data,
            },
            {
              onSuccess: () => {
                dispatch(showSuccess("Manager updated."));

                router.replace(
                  `/user/admin/managers/${id}`
                );
              },

              onError: (error: any) => {
                const appError = normalizeApiError(error);
                dispatch(showError(appError.message));
              },
            }
          )
        }
      />
    </ScreenScrollView>
  );
}