import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, KeyRound, Lock } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useTheme } from "@/design-system/theme/useTheme";

import { acceptInviteRequest } from "@/core/api/auth";
import { AuthFormLayout } from "../components/AuthFormLayout";
import { CFELogo } from "../components/CFELogo";
import { FormInput } from "../components/FormInput";
import { useFieldChain } from "@/shared/hooks/useFieldChain";
import {
  acceptInviteSchema,
  AcceptInviteFormData,
} from "../schemas/acceptInvite.schema";

export function AcceptInviteScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { token: tokenFromLink } = useLocalSearchParams<{ token?: string }>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),

    defaultValues: {
      // Prefilled when the deep link carried it, empty when the user arrived
      // by hand. The screen previously refused outright without a token in the
      // route, which left the desktop path -- where the app cannot be opened
      // from the browser at all -- with no way through but asking for a second
      // invitation.
      token: tokenFromLink ?? "",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: AcceptInviteFormData) =>
      acceptInviteRequest(data.token.trim(), data.password),

    onSuccess: () => {
      // Replace rather than push: the invitation is spent, and going back to
      // it would show a form that can now only fail.
      router.replace("/auth/login");
    },
  });

  const chain = useFieldChain(
    ["token", "password", "confirmPassword"],
    {
      onSubmit: () =>
        void handleSubmit((data) =>
          mutation.mutate(data)
        )(),
    }
  );

  return (
    <AuthFormLayout>
      <View>
        <View className="items-center mb-8">
        <View className="rounded-[32px] bg-surface/95 p-5 shadow-2xl shadow-slate-900/10 dark:bg-dark-surface/90 dark:shadow-slate-950/20">
          <CFELogo size="large" />
        </View>

        <Text className="mt-6 text-3xl font-bold text-text dark:text-dark-text">
          Accept your invitation
        </Text>

        <Text className="mt-2 max-w-[300px] text-center text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
          </Text>
        </View>

        <View className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-slate-950/20">
          <Controller
            control={control}
            name="token"
            render={({ field }) => (
              <FormInput
                label="Invitation code"
                placeholder="Paste the code from your email"
                autoCapitalize="none"
                autoCorrect={false}
                icon={<KeyRound size={20} color={theme.colors.primary} />}
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.token?.message}
                {...chain.field("token")}
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

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormInput
                label="Confirm password"
                placeholder="••••••••"
                secureTextEntry
                icon={<Lock size={20} color={theme.colors.primary} />}
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.confirmPassword?.message}
                {...chain.field(
                  "confirmPassword"
                )}
              />
            )}
          />

          <TouchableOpacity
            className="mt-2 h-14 items-center justify-center rounded-3xl bg-primary shadow-lg dark:bg-dark-primary"
            style={{ opacity: mutation.isPending ? 0.7 : 1 }}
            disabled={mutation.isPending}
            onPress={() => void handleSubmit((data) => mutation.mutate(data))()}
            activeOpacity={0.85}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={theme.colors.textInverted} size="small" />
            ) : (
              <Text className="text-base font-semibold text-text-inverted">
                Activate account
              </Text>
            )}
          </TouchableOpacity>

          {mutation.isError && (
            <View className="mt-4 flex-row items-center rounded-3xl border border-danger bg-danger/10 px-4 py-3 dark:border-dark-danger dark:bg-dark-danger/10">
              <AlertCircle size={16} color={theme.colors.danger} />

              <Text className="ml-3 flex-1 text-sm font-medium text-danger dark:text-dark-danger">
                {/*
                  Deliberately covers both causes. An invitation that has been
                  used already and one that has expired are the same state to
                  the server, and guessing between them in the copy would be
                  wrong half the time.
                */}
                This invitation could not be accepted. It may have expired or
                already been used. Ask your firm to send a new one.
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => router.replace("/auth/login")}
          activeOpacity={0.75}
        >
          <Text className="text-sm font-semibold text-primary dark:text-dark-primary">
            Already activated? Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </AuthFormLayout>
  );
}
