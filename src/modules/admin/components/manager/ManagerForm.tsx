import React from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { useTheme } from "@/design-system/theme/useTheme";

import {
  Controller,
  useForm,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  createManagerSchema,
  CreateManagerFormData,
} from "@/modules/admin/schemas/createManagerSchema";

import { useFieldChain } from "@/shared/hooks/useFieldChain";

type Props = {
  defaultValues?: Partial<CreateManagerFormData>;

  loading?: boolean;

  submitText?: string;

  onSubmit: (
    data: CreateManagerFormData
  ) => void;
};

export function ManagerForm({
  defaultValues,
  loading = false,
  submitText = "Save",
  onSubmit,
}: Props) {
  const { theme } = useTheme();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } =
    useForm<CreateManagerFormData>({
      resolver: zodResolver(
        createManagerSchema
      ),

      defaultValues: {
        first_name: "",
        last_name: "",
        email: "",

        ...defaultValues,
      },
    });

  const chain = useFieldChain(
    ["first_name", "last_name", "email"],
    {
      onSubmit: () =>
        void handleSubmit(onSubmit)(),
    }
  );

  return (
    <View>
      <Controller
        control={control}
        name="first_name"
        render={({ field }) => (
          <TextInput
            className="border border-border dark:border-dark-border rounded-lg p-3.5 mb-2 bg-surface dark:bg-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary"
            placeholder="First name"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
              placeholderTextColor={theme.colors.textMuted}
            {...chain.field(
              "first_name"
            )}
          />
        )}
      />

      {errors.first_name && (
        <Text className="text-danger dark:text-dark-danger mb-3">
          {errors.first_name.message}
        </Text>
      )}

      <Controller
        control={control}
        name="last_name"
        render={({ field }) => (
          <TextInput
            className="border border-border dark:border-dark-border rounded-lg p-3.5 mb-2 bg-surface dark:bg-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary"
            placeholder="Last name"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
              placeholderTextColor={theme.colors.textMuted}
            {...chain.field(
              "last_name"
            )}
          />
        )}
      />

      {errors.last_name && (
        <Text className="text-danger dark:text-dark-danger mb-3">
          {errors.last_name.message}
        </Text>
      )}

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput
            className="border border-border dark:border-dark-border rounded-lg p-3.5 mb-2 bg-surface dark:bg-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
              placeholderTextColor={theme.colors.textMuted}
            {...chain.field("email")}
          />
        )}
      />

      {errors.email && (
        <Text className="text-danger dark:text-dark-danger mb-3">
          {errors.email.message}
        </Text>
      )}

      <TouchableOpacity
        className="mt-5 p-4 rounded-lg items-center bg-text dark:bg-dark-text disabled:opacity-50"
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