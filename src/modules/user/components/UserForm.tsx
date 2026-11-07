import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/design-system/theme/useTheme";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  userSchema,
  UserFormData,
} from "../schemas/user.schema";
import { FormInput } from "@/modules/auth/components/FormInput";

import { useFieldChain } from "@/shared/hooks/useFieldChain";

type Props = {
  title: string;
  submitText: string;
  loading?: boolean;
  error?: string;
  defaultValues?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
};

export function UserForm({
  title,
  submitText,
  loading = false,
  error,
  defaultValues,
  onSubmit,
}: Props) {
  const { theme } = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),

    defaultValues: {
      first_name: defaultValues?.first_name ?? "",
      last_name: defaultValues?.last_name ?? "",
      email: defaultValues?.email ?? "",
      password: "",
      confirm_password: "",
    },
  });

  const chain = useFieldChain(
    [
      "first_name",
      "last_name",
      "email",
      "password",
      "confirm_password",
    ],
    {
      onSubmit: () =>
        void handleSubmit(onSubmit)(),
    }
  );

  return (
    <View className="flex-1 p-6 bg-background dark:bg-dark-background">
      <Text className="text-3xl font-bold text-text dark:text-dark-text mb-6">
        {title}
      </Text>

      <Controller
        control={control}
        name="first_name"
        render={({ field }) => (
          <TextInput
            className="border border-border dark:border-dark-border rounded-lg p-3.5 mb-2.5 bg-surface dark:bg-dark-surface text-text dark:text-dark-text"
            placeholder="First Name"
              placeholderTextColor={theme.colors.textMuted}
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            {...chain.field(
              "first_name"
            )}
          />
        )}
      />

      {errors.first_name && (
        <Text className="text-danger dark:text-dark-danger mb-2.5">
          {errors.first_name.message}
        </Text>
      )}

      <Controller
        control={control}
        name="last_name"
        render={({ field }) => (
          <TextInput
            className="border border-border dark:border-dark-border rounded-lg p-3.5 mb-2.5 bg-surface dark:bg-dark-surface text-text dark:text-dark-text"
            placeholder="Last Name"
              placeholderTextColor={theme.colors.textMuted}
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            {...chain.field(
              "last_name"
            )}
          />
        )}
      />

      {errors.last_name && (
        <Text className="text-danger dark:text-dark-danger mb-2.5">
          {errors.last_name.message}
        </Text>
      )}

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput
            className="border border-border dark:border-dark-border rounded-lg p-3.5 mb-2.5 bg-surface dark:bg-dark-surface text-text dark:text-dark-text"
            placeholder="Email"
                placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            {...chain.field("email")}
          />
        )}
      />

      {errors.email && (
        <Text className="text-danger dark:text-dark-danger mb-2.5">
          {errors.email.message}
        </Text>
      )}

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <FormInput
            label="Password"
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            {...chain.field(
              "password"
            )}
          />
        )}
      />

      {errors.password && (
        <Text className="text-danger dark:text-dark-danger mb-2.5">
          {errors.password.message}
        </Text>
      )}

      <Controller
        control={control}
        name="confirm_password"
        render={({ field }) => (
          <FormInput
            label="Confirm password"
            placeholder="Confirm Password"
            secureTextEntry
            autoCapitalize="none"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            {...chain.field(
              "confirm_password"
            )}
          />
        )}
      />

      {errors.confirm_password && (
        <Text className="text-danger dark:text-dark-danger mb-2.5">
          {errors.confirm_password.message}
        </Text>
      )}

      {error && (
        <Text className="text-danger dark:text-dark-danger mb-2.5">
          {error}
        </Text>
      )}

      <TouchableOpacity
        className="mt-3 p-4 bg-text dark:bg-dark-text rounded-lg items-center"
        disabled={loading}
        onPress={() => void handleSubmit(onSubmit)()}
      >
        {loading ? (
            <ActivityIndicator color={theme.colors.textInverted} />
        ) : (
          <Text className="text-background dark:text-dark-background font-semibold">
            {submitText}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}