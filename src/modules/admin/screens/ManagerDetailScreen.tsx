import React from "react";

import { View, TouchableOpacity, Text, Alert } from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useDispatch } from "react-redux";

import { useManager } from "../hooks/manager/useManager";
import { useDeleteManager } from "../hooks/manager/useDeleteManager";

import { AccountLockBanner } from "../components/AccountLockBanner";
import { ManagerProfile } from "../components/manager/ManagerProfile";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { showError, showSuccess } from "@/core/store/notificationSlice";
import { QueryState } from "@/core/components/QueryState";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

export function ManagerDetailScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const router = useRouter();
  const dispatch = useDispatch();

  const manager =
    useManager(id);

  const deleteManager =
    useDeleteManager();

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
        <Text className="text-text dark:text-dark-text">
          Manager not found.
        </Text>
      </View>
    );
  }

  const remove = () => {
    Alert.alert(
      "Delete Manager",
      "Are you sure?",
      [
        {
          text: "Cancel",
        },

        {
          text: "Delete",

          style: "destructive",

          onPress: () => {

            deleteManager.mutate(id, {

              onSuccess: () => {
                dispatch(showSuccess("Manager deleted."));

                router.replace(
                  "/user/admin/managers"
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
        lockedAt={manager.data.locked_at}
      />

      <ManagerProfile
        manager={manager.data}
      />

      <TouchableOpacity
        className="mt-6 p-4 rounded-lg items-center bg-text dark:bg-dark-text"
        onPress={() =>
          router.push(
            `/user/admin/managers/${id}/edit`
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