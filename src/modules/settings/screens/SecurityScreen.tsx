import { useEffect, useState } from "react";
import { ActivityIndicator, Switch, Text, View } from "react-native";

import { ShieldCheck } from "lucide-react-native";
import { useTheme } from "@/design-system/theme/useTheme";

import { QueryState } from "@/core/components/QueryState";
import { Icon } from "@/design-system/ui";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";
import { PressableScale } from "@/design-system/ui/motion/PressableScale";
import { useMyProfile } from "@/modules/user/hooks/useMyProfile";
import {
  TwoFactorPasswordError,
  useSetTwoFactor,
} from "../api/twoFactor";
import { FormInput } from "@/modules/auth/components/FormInput";

export function SecurityScreen() {
  const { theme } = useTheme();
  const { data, isLoading, isError, error, refetch } = useMyProfile();
  const mutation = useSetTwoFactor();


  const enabled = !!data?.two_factor_enabled;

  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [failure, setFailure] = useState("");

  // Cleared whenever the saved value changes, so a password typed for a
  // cancelled attempt is not still sitting in memory, or on screen, later.
  useEffect(() => {
    setConfirming(false);
    setPassword("");
    setFailure("");
  }, [enabled]);

  if (isLoading || isError) {
    return (
      <SharedLayout title="Security">
        <View className="p-4">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
          />
        </View>
      </SharedLayout>
    );
  }

  const disable = () => {
    setFailure("");

    mutation.mutate(
      { enabled: false, currentPassword: password },
      {
        onError: (err) => {
          setFailure(
            err instanceof TwoFactorPasswordError
              ? err.message
              : "Could not change the setting. Try again.",
          );
        },
      },
    );
  };

  return (
    <SharedLayout title="Security">
      <View className="p-4">
        <View className="rounded-2xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
          <View className="flex-row items-center">
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Icon as={ShieldCheck} size="lg" tone="primary" />
            </View>

            <View className="flex-1 pr-3">
              <Text className="text-base font-semibold text-text dark:text-dark-text">
                Two-step sign-in
              </Text>

              <Text className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
                Email a one-time code after your password
              </Text>
            </View>

            <Switch
              value={enabled}
              disabled={mutation.isPending}
              onValueChange={(next) => {
                setFailure("");

                if (next) {
                  mutation.mutate({ enabled: true });
                  return;
                }

                // Turning it off asks for the password first, so the switch
                // does not appear to move before the server has agreed.
                setConfirming(true);
              }}
            />
          </View>

          <Text className="mt-4 text-xs leading-5 text-text-secondary dark:text-dark-text-secondary">
            {enabled
              ? "You will be asked for a code sent to your email each time you sign in. Codes last 10 minutes and can be used once."
              : "Anyone who learns your password can sign in as you. A code sent to your email means a stolen password is not enough on its own."}
          </Text>
        </View>

        {confirming && (
          <View className="mt-4 rounded-2xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
            <Text className="text-sm font-semibold text-text dark:text-dark-text">
              Confirm it is you
            </Text>

            <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
              Enter your password to turn two-step sign-in off.
            </Text>

            <FormInput
              label="Current password"
              placeholder="Current password"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            {!!failure && (
              <Text className="mt-3 text-xs text-danger dark:text-dark-danger">
                {failure}
              </Text>
            )}

            <View className="mt-4 flex-row">
              <PressableScale
                className="mr-3 flex-1 items-center rounded-xl border border-border px-4 py-3 dark:border-dark-border"
                onPress={() => {
                  setConfirming(false);
                  setPassword("");
                  setFailure("");
                }}
              >
                <Text className="text-sm font-semibold text-text dark:text-dark-text">
                  Cancel
                </Text>
              </PressableScale>

              <PressableScale
                className="flex-1 items-center rounded-xl bg-danger px-4 py-3 dark:bg-dark-danger"
                style={{ opacity: !password || mutation.isPending ? 0.6 : 1 }}
                disabled={!password || mutation.isPending}
                onPress={disable}
              >
                {mutation.isPending ? (
                    <ActivityIndicator color={theme.colors.textInverted} size="small" />
                ) : (
                    <Text className="text-sm font-semibold text-text-inverted">
                    Turn off
                  </Text>
                )}
              </PressableScale>
            </View>
          </View>
        )}

        {mutation.isError && !confirming && (
          <Text className="mt-4 text-xs text-danger dark:text-dark-danger">
            Could not change the setting. Try again.
          </Text>
        )}
      </View>
    </SharedLayout>
  );
}
