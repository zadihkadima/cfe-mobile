import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { useState } from "react";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, AlertCircle } from "lucide-react-native";

import { useTheme } from "@/design-system/theme/useTheme";

import {
  loginSchema,
  LoginFormData,
} from "../schemas/login.schema";

import { useLogin } from "../hooks/useLogin";
import { AuthFormLayout } from "../components/AuthFormLayout";
import { CFELogo } from "../components/CFELogo";
import { FormInput } from "../components/FormInput";
import { useFieldChain } from "@/shared/hooks/useFieldChain";
import { normalizeApiError } from "@/core/errors/normalizeApiError";

export function LoginScreen() {
  const { theme } = useTheme();
  const loginMutation = useLogin();
  const [failedAttempts, setFailedAttempts] = useState(0);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => setFailedAttempts(0),
      onError: (error) => {
        if (normalizeApiError(error).code === "UNAUTHORIZED") {
          setFailedAttempts((current) => current + 1);
        }
      },
    });
  };

  const loginError = loginMutation.isError
    ? normalizeApiError(loginMutation.error)
    : undefined;

  // Finishing the email moves to the password, and finishing the password
  // signs in -- so the whole form can be completed without once reaching past
  // the keyboard to find the next box.
  const chain = useFieldChain(["email", "password"], {
    onSubmit: () => void handleSubmit(onSubmit)(),
  });

  return (
    <AuthFormLayout>
      <View>
        {/* Spacing is stated here rather than left to `justify-between` on a
            flexed child. That handed every pixel of leftover height to a
            single gap, so on a tall screen the heading and the form sat at
            opposite ends with an empty band between them. */}
        <View className="items-center mb-8 space-y-4">
            
              <CFELogo size="large" />
            

            <Text className="text-3xl font-bold text-text dark:text-dark-text">
              Welcome Back
            </Text>
            <Text className="max-w-[300px] text-center text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
          </Text>
        </View>

          <View className="rounded-[32px] border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/90 p-6 shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/20">
            <View className="space-y-4">
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <FormInput
                    label="Email Address"
                    placeholder="your@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    icon={<Mail size={20} color={theme.colors.primary} />}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    error={errors.email?.message}
                    {...chain.field("email")}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <FormInput
                    label="Password"
                    placeholder="••••••••"
                    secureTextEntry
                    icon={<Lock size={20} color={theme.colors.primary} />}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    error={errors.password?.message}
                    {...chain.field("password")}
                  />
                )}
              />
            </View>

            <Link href="/auth/forgot-password" asChild>
              <TouchableOpacity className="mt-3 self-end" activeOpacity={0.75}>
                <Text className="text-sm font-semibold text-primary dark:text-dark-primary">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              className="mt-6 h-14 items-center justify-center rounded-3xl shadow-lg bg-primary dark:bg-dark-primary"
              style={{
                opacity: loginMutation.isPending ? 0.7 : 1,
              }}
              disabled={loginMutation.isPending}
              onPress={() => void handleSubmit(onSubmit)()}
              activeOpacity={0.85}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator color={theme.colors.textInverted} size="small" />
              ) : (
                <Text className="text-base font-semibold text-text-inverted">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {loginError && (
              <View className="mt-4 flex-row items-center rounded-3xl px-4 py-3 bg-danger/10 dark:bg-dark-danger/10 border border-danger dark:border-dark-danger">
                <AlertCircle size={16} color={theme.colors.danger} />
                <Text className="ml-3 flex-1 text-sm font-medium text-danger dark:text-dark-danger">
                  {loginError.code === "ACCOUNT_LOCKED"
                    ? loginError.message
                    : "Login failed. Please try again."}
                </Text>
              </View>
            )}

            {failedAttempts > 0 && loginError?.code !== "ACCOUNT_LOCKED" ? (
              <Text className="mt-3 text-center text-xs text-text-secondary dark:text-dark-text-secondary">
                Failed sign-in attempts in this session: {failedAttempts}. Check your password before trying again.
              </Text>
            ) : null}
          </View>

        {/* Below the form because that is where someone who cannot sign in
            will look, and reachable without a session because an invited user
            has no session yet. The deep link in the email lands on the same
            screen with the code already filled; this is the way in for anyone
            whose mail client would not open it, which on a desktop is
            everyone. */}
        <View className="mt-8 items-center">
          <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Invited to join a workspace?
          </Text>

          <Link href="/auth/accept-invite" asChild>
            <TouchableOpacity
              className="mt-2 px-2 py-1"
              activeOpacity={0.75}
              accessibilityRole="link"
            >
              <Text className="text-sm font-semibold text-primary dark:text-dark-primary">
                Accept your invitation
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </AuthFormLayout>
  );
}
