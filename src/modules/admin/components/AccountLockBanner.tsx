import { Alert, Text, View } from "react-native";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react-native";

import { api } from "@/core/api/client";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { store } from "@/core/store";
import { showError } from "@/core/store/notificationSlice";
import { Icon } from "@/design-system/ui";
import { PressableScale } from "@/design-system/ui/motion/PressableScale";

/**
 * Shown on an account that has locked itself after repeated wrong passwords.
 *
 * Without it the lock is invisible to the only person who can clear it: the
 * user is told to contact an administrator, and the administrator has no
 * screen that says anything is wrong.
 */
export function AccountLockBanner({
  userId,
  lockedAt,
  onUnlocked,
}: {
  userId: string;
  lockedAt?: string | null;
  onUnlocked?: () => void;
}) {
  const queryClient = useQueryClient();

  const unlock = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/users/${userId}/unlock`);
    },

    onSuccess: () => {
      // Everything is invalidated rather than one key, because the same
      // account appears in the list, the detail screen and the report, and a
      // banner that lingers on one of them looks like the unlock failed.
      void queryClient.invalidateQueries();
      onUnlocked?.();
    },

    onError: (error) => {
      store.dispatch(showError(normalizeApiError(error).message));
    },
  });

  if (!lockedAt) {
    return null;
  }

  return (
    <View className="mb-4 flex-row items-center rounded-2xl border border-danger/40 bg-danger/5 p-4">
      <Icon as={Lock} size="md" tone="danger" />

      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-danger">Account locked</Text>

        <Text className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
          Locked on {new Date(lockedAt).toLocaleString()} after too many failed sign-in attempts.
        </Text>
      </View>

      <PressableScale
        disabled={unlock.isPending}
        hitSlop={8}
        onPress={() => {
          Alert.alert(
            "Unlock this account?",
            "They will be able to sign in again immediately. Confirm they are who they say they are first.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Unlock", onPress: () => unlock.mutate() },
            ],
          );
        }}
      >
        <Text className="text-xs font-semibold text-primary">
          {unlock.isPending ? "Unlocking…" : "Unlock"}
        </Text>
      </PressableScale>
    </View>
  );
}
