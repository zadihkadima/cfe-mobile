import React from "react";

import { View, Text } from "react-native";
import { useDispatch } from "react-redux";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { ClientForm } from "@/modules/admin/components/client/ClientForm";

import { useManagerClient } from "@/modules/manager/hooks/client/useManagerClient";
import { useUpdateManagerClient } from "@/modules/manager/hooks/client/useUpdateManagerClient";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { showError, showSuccess } from "@/core/store/notificationSlice";
import { QueryState } from "@/core/components/QueryState";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

export function ManagerClientEditScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const router = useRouter();
  const dispatch = useDispatch();

  const client =
    useManagerClient(id);

  const update =
    useUpdateManagerClient();

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

          // `?? ""` rather than passing the possibly-undefined value straight
          // through: the form's inputs are controlled, and a controlled input
          // must never see `undefined` -- it would flip to uncontrolled.
          date_of_birth: client.data.date_of_birth ?? "",
          client_code: client.data.client_code ?? "",
          reason_for_consultation:
            client.data.reason_for_consultation ?? "",
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
                  `/user/manager/clients/${id}`
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
