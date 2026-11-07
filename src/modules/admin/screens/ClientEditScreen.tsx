import React from "react";

import { View, Text } from "react-native";
import { useDispatch } from "react-redux";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { ClientForm } from "@/modules/admin/components/client/ClientForm";

import { useClient } from "@/modules/admin/hooks/client/useClient";
import { useUpdateClient } from "@/modules/admin/hooks/client/useUpdateClient";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { showError, showSuccess } from "@/core/store/notificationSlice";
import { QueryState } from "@/core/components/QueryState";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

export function ClientEditScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const router = useRouter();
  const dispatch = useDispatch();

  const client =
    useClient(id);

  const update =
    useUpdateClient();

  if (client.isLoading || client.isError) {
    return (
      <View className="flex-1 p-5 bg-background dark:bg-dark-background">
        <QueryState
          isLoading={client.isLoading}
          isError={client.isError}
          error={client.error}
          onRetry={client.refetch}
        />
      </View>
    );
  }

  if (!client.data) {
    return (
      <View className="flex-1 justify-center items-center bg-background dark:bg-dark-background">
        <Text className="text-text dark:text-dark-text">Client not found.</Text>
      </View>
    );
  }

  return (
    <ScreenScrollView>
      <Text className="text-3xl font-bold text-text dark:text-dark-text mb-6">
        Edit Client
      </Text>

      <ClientForm
        defaultValues={{
          first_name: client.data.first_name,
          last_name: client.data.last_name,
          email: client.data.email,
        }}

        loading={update.isPending}

        submitText="Update Client"

        onSubmit={(data) =>
          update.mutate(
            {
              id,
              data,
            },
            {
              onSuccess: () => {
                dispatch(showSuccess("Client updated."));

                router.replace(
                  `/user/admin/clients/${id}`
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