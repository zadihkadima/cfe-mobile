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
  createClientSchema,
  CreateClientFormData,
} from "@/modules/admin/schemas/createClientSchema";

import { useFieldChain } from "@/shared/hooks/useFieldChain";
import { DateField } from "@/design-system/ui/input/DateField";

type Props = {
  defaultValues?: Partial<CreateClientFormData>;

  loading?: boolean;

  submitText?: string;

  onSubmit: (
    data: CreateClientFormData
  ) => void;
};

export function ClientForm({
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
    useForm<CreateClientFormData>({
      resolver: zodResolver(
        createClientSchema
      ),

      defaultValues: {
        first_name: "",
        last_name: "",
        email: "",

        date_of_birth: "",
        client_code: "",
        reason_for_consultation: "",

        ...defaultValues,
      },
    });

  // `reason_for_consultation` is deliberately absent: it is multiline, and a
  // multiline field must not be chained -- its return key inserts a newline.
  // `client_code` closes the chain, so its key reads "done".
  const chain = useFieldChain(
    [
      "first_name",
      "last_name",
      "email",
      "date_of_birth",
      "client_code",
    ],
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

      <Controller
        control={control}
        name="date_of_birth"
        render={({ field }) => (
          // No chain.field here: DateField is a picker, not a text input, and
          // the next key on a date field is "next" toward the code below.
          <DateField
            label="Date of birth"
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.date_of_birth?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="client_code"
        render={({ field }) => (
          <TextInput
            className="border border-border dark:border-dark-border rounded-lg p-3.5 mb-2 bg-surface dark:bg-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary"
            placeholder="Client code"
            autoCapitalize="characters"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholderTextColor={theme.colors.textMuted}
            {...chain.field("client_code")}
          />
        )}
      />

      {errors.client_code && (
        <Text className="text-danger dark:text-dark-danger mb-3">
          {errors.client_code.message}
        </Text>
      )}

      <Controller
        control={control}
        name="reason_for_consultation"
        render={({ field }) => (
          <TextInput
            className="border border-border dark:border-dark-border rounded-lg p-3.5 mb-2 bg-surface dark:bg-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary"
            placeholder="Reason for consultation"
            multiline
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholderTextColor={theme.colors.textMuted}
            // Not chained: multiline. Its return key must insert a newline.
          />
        )}
      />

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