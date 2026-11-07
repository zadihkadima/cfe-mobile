import React from "react";

import { View, TouchableOpacity, Text, Alert } from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useDispatch } from "react-redux";

import { useClient } from "../hooks/client/useClient";
import { useDeleteClient } from "../hooks/client/useDeleteClient";

import { AccountLockBanner } from "../components/AccountLockBanner";
import { ClientProfile } from "../components/client/ClientProfile";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { showError, showSuccess } from "@/core/store/notificationSlice";
import { QueryState } from "@/core/components/QueryState";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

export function ClientDetailScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const router = useRouter();
  const dispatch = useDispatch();

  const client =
    useClient(id);

  const deleteClient =
    useDeleteClient();

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
        <Text className="text-text dark:text-dark-text">
          Client not found.
        </Text>
      </View>
    );
  }

  const remove = () => {
    Alert.alert(
      "Delete Client",
      "Are you sure?",
      [
        {
          text: "Cancel",
        },

        {
          text: "Delete",

          style: "destructive",

          onPress: () => {

            deleteClient.mutate(id, {

              onSuccess: () => {
                dispatch(showSuccess("Client deleted."));

                router.replace(
                  "/user/admin/clients"
                );

              },

              onError: (error) => {
                const appError = normalizeApiError(error);
                dispatch(showError(appError.message));
              },

            });

          },
        },
      ]
    );
  };

  return (
    <ScreenScrollView>
      {/* Above the profile, not below it. A lock is the reason an
          admin opened this screen, and a notice under a form is a
          notice read after the decision it should have informed. */}
      <AccountLockBanner
        userId={id}
        lockedAt={client.data.locked_at}
      />

      <ClientProfile
        client={client.data}
      />

      <TouchableOpacity
        className="mt-6 p-4 rounded-lg items-center bg-text dark:bg-dark-text"
        onPress={() =>
          router.push(
            `/user/admin/clients/${id}/edit`
          )
        }
      >
        <Text className="text-background dark:text-dark-background font-semibold">
          Edit
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-3 p-4 rounded-lg items-center bg-danger dark:bg-dark-danger"
        onPress={remove}
      >
        <Text className="text-white font-semibold">
          Delete
        </Text>
      </TouchableOpacity>
    </ScreenScrollView>
  );
}