import { useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/design-system/theme/useTheme";

import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";

import { forgotPasswordRequest } from "@/core/api/auth";
import { AuthFormLayout } from "../components/AuthFormLayout";

export function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async () => forgotPasswordRequest(email.trim()),
    onSuccess: () => {
      setMessage("If your account exists, a reset email has been sent.");
    },
  });

  return (
    <AuthFormLayout className="bg-background dark:bg-dark-background">
      <View>
      <Text className="mb-2 text-2xl font-bold text-text dark:text-dark-text">Forgot password</Text>
      <Text className="mb-5 text-text-secondary dark:text-dark-text-secondary">
        Enter your email to receive a reset token.
      </Text>

      <TextInput
        className="mb-4 rounded-xl border border-border bg-surface px-4 py-3 text-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
        placeholder="Email"
        placeholderTextColor={theme.colors.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Pressable
        className="items-center rounded-xl bg-primary px-4 py-3 dark:bg-dark-primary"
        onPress={() => mutation.mutate()}
        disabled={!email.trim() || mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={theme.colors.textInverted} />
        ) : (
          <Text className="font-semibold text-text-inverted">Send reset email</Text>
        )}
      </Pressable>

      {!!message && (
        <Text className="mt-4 text-success dark:text-dark-success">{message}</Text>
      )}

      {!!mutation.error && (
        <Text className="mt-4 text-danger dark:text-dark-danger">Unable to send reset email.</Text>
      )}

      <Link href="/auth/reset-password" className="mt-6 text-primary dark:text-dark-primary">
        Already have token? Reset password
      </Link>

      <Pressable className="mt-3" onPress={() => router.back()}>
        <Text className="text-text-secondary dark:text-dark-text-secondary">Back</Text>
      </Pressable>
      </View>
    </AuthFormLayout>
  );
}
