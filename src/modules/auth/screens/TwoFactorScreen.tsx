import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, ShieldCheck } from "lucide-react-native";

import { useTheme } from "@/design-system/theme/useTheme";

import { useResendTwoFactor, useVerifyTwoFactor } from "../hooks/useTwoFactor";
import { AuthFormLayout } from "../components/AuthFormLayout";

const CODE_LENGTH = 6;

/**
 * The second step of signing in.
 *
 * It takes the challenge handle from the route rather than holding it in a
 * store, so a reload does not strand the user at a prompt whose handle has
 * been forgotten -- at which point neither finishing nor restarting works.
 */
export function TwoFactorScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ challenge: string; email: string }>();

  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(60);

  const verify = useVerifyTwoFactor();
  const resend = useResendTwoFactor();

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // The keyboard is opened for them. This screen has exactly one field and
    // nothing to read, so making the user tap it first is a step with no
    // purpose.
    const timer = setTimeout(() => inputRef.current?.focus(), 350);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = (value: string) => {
    if (value.length !== CODE_LENGTH || verify.isPending) {
      return;
    }

    verify.mutate({ challenge_id: params.challenge, code: value });
  };

  const onChange = (next: string) => {
    const digits = next.replace(/\D/g, "").slice(0, CODE_LENGTH);

    setCode(digits);

    // Submitted as soon as the code is complete. Requiring a button press
    // after typing the last digit is a tap that can only ever be pressed once
    // the answer is already known.
    submit(digits);
  };

  const failure = verify.error as { response?: { data?: { error?: string } } } | null;

  return (
    <AuthFormLayout>
      <View>
      <View className="mb-8 items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck size={28} color={theme.colors.primary} />
        </View>

        <Text className="text-2xl font-bold text-text dark:text-dark-text">Check your email</Text>

        <Text className="mt-2 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
          We sent a {CODE_LENGTH}-digit code to {params.email ?? "your email"}. It expires in ten
          minutes.
        </Text>
      </View>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        editable={!verify.isPending}
        className="rounded-2xl border border-border bg-surface py-4 text-center text-3xl font-bold tracking-[12px] text-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
      />

      {failure ? (
        <View className="mt-4 flex-row items-center rounded-xl bg-danger/10 p-3">
          <AlertCircle size={16} color={theme.colors.danger} />

          <Text className="ml-2 flex-1 text-xs text-danger">
            {failure.response?.data?.error ?? "That code could not be checked. Try again."}
          </Text>
        </View>
      ) : null}

      {verify.isPending ? (
        <ActivityIndicator className="mt-6" />
      ) : (
        <TouchableOpacity
          disabled={cooldown > 0 || resend.isPending}
          onPress={() => {
            resend.mutate(undefined, { onSuccess: () => setCooldown(60) });
          }}
          className="mt-6 items-center py-3"
        >
          <Text
            className={
              cooldown > 0
                ? "text-sm text-text-secondary dark:text-dark-text-secondary"
                : "text-sm font-semibold text-primary"
            }
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Send a new code"}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.replace("/auth/login")} className="items-center py-2">
        <Text className="text-sm text-text-secondary dark:text-dark-text-secondary">
          Use a different account
        </Text>
      </TouchableOpacity>
      </View>
    </AuthFormLayout>
  );
}
