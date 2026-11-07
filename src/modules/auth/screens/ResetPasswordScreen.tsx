import { useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";

import { resetPasswordRequest } from "@/core/api/auth";
import { AuthFormLayout } from "../components/AuthFormLayout";
import { FormInput } from "../components/FormInput";

import { useTheme } from "@/design-system/theme/useTheme";

export function ResetPasswordScreen() {
  const router = useRouter();
  const { token: tokenFromParams } = useLocalSearchParams<{ token?: string }>();

  const { theme } = useTheme();

  const [token, setToken] = useState(tokenFromParams ?? "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async () => resetPasswordRequest(token.trim(), password),
    onSuccess: () => {
      setMessage("Password updated. You can now sign in.");
      setTimeout(() => {
        router.replace("/auth/login");
      }, 500);
    },
  });

  return (
    <AuthFormLayout className="bg-background dark:bg-dark-background">
      <View>
      <Text className="mb-2 text-2xl font-bold text-text dark:text-dark-text">Reset password</Text>
      <Text className="mb-5 text-text-secondary dark:text-dark-text-secondary">
        Enter the reset token and a new password.
      </Text>

      <FormInput
        label="Reset code"
        placeholder="Reset code from your email"
        autoCapitalize="none"
        autoCorrect={false}
        value={token}
        onChangeText={setToken}
      />

      <FormInput
        label="New password"
        placeholder="New password"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        className="items-center rounded-xl bg-primary px-4 py-3 dark:bg-dark-primary"
        onPress={() => mutation.mutate()}
        // Eight, matching the sign-in form. The API accepts six, which would
        // let someone set a password here that they are then told is too short
        // when they try to use it.
        disabled={!token.trim() || password.length < 8 || mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={theme.colors.textInverted} />
        ) : (
          <Text className="font-semibold text-text-inverted">Reset password</Text>
        )}
      </Pressable>

      {!!message && (
        <Text className="mt-4 text-success dark:text-dark-success">{message}</Text>
      )}

      {!!mutation.error && (
        <Text className="mt-4 text-danger dark:text-dark-danger">Invalid token or request failed.</Text>
      )}

      <Pressable className="mt-3" onPress={() => router.back()}>
        <Text className="text-text-secondary dark:text-dark-text-secondary">Back</Text>
      </Pressable>
      </View>
    </AuthFormLayout>
  );
}
