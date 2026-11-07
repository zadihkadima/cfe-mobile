import { useState } from "react";
import { View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import * as DocumentPicker from "expo-document-picker";

import { useMyProfile } from "@/modules/user/hooks/useMyProfile";
import { useUpdateMyProfile } from "@/modules/user/hooks/useUpdateMyProfile";
import { useUploadMyAvatar } from "@/modules/user/hooks/useUploadMyAvatar";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { QueryState } from "@/core/components/QueryState";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";
import { Avatar, Button, Field, Text } from "@/design-system/ui";
import { showError, showSuccess } from "@/core/store/notificationSlice";
import { useFieldChain } from "@/shared/hooks/useFieldChain";

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  tax_id: string;
  social_security_number: string;
};

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Profile", href: "/user/profile" },
  { label: "Edit" },
];

export function EditMyProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { data, isLoading, isError, error, refetch } = useMyProfile();
  const update = useUpdateMyProfile();
  const uploadAvatar = useUploadMyAvatar();

  const [pickingPhoto, setPickingPhoto] = useState(false);

  const { control, handleSubmit } = useForm<FormData>({
    values: {
      first_name: data?.first_name ?? "",
      last_name: data?.last_name ?? "",
      email: data?.email ?? "",
      tax_id: data?.tax_id ?? "",
      social_security_number: data?.social_security_number ?? "",
    },
  });

  const save = () =>
    void handleSubmit((form) =>
      update.mutate(form, {
        onSuccess: () => {
          dispatch(showSuccess("Profile updated."));
          router.replace("/user/profile");
        },
        onError: (err) => {
          dispatch(showError(normalizeApiError(err).message));
        },
      }),
    )();

  const chain = useFieldChain(
    [
      "first_name",
      "last_name",
      "email",
      "tax_id",
      "social_security_number",
    ],
    { onSubmit: save },
  );

  /**
   * Picks a picture and sends it.
   *
   * The document picker is used rather than an image picker because it is
   * already part of this build. Adding `expo-image-picker` would mean a new
   * native module, and therefore a new dev client before anyone could use this
   * at all -- a poor trade for a camera button. The type filter still limits
   * the sheet to images, and the server inspects the bytes regardless.
   */
  const choosePhoto = async () => {
    setPickingPhoto(true);

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/gif"],
        multiple: false,
        // Without this the uri can point somewhere the app loses access to
        // once the picker closes, which is exactly when it is read.
        copyToCacheDirectory: true,
      });

      if (picked.canceled || !picked.assets?.[0]) {
        return;
      }

      const asset = picked.assets[0];

      await uploadAvatar.mutateAsync({
        uri: asset.uri,
        name: asset.name || "avatar.jpg",
        mimeType: asset.mimeType || "image/jpeg",
      });

      dispatch(showSuccess("Photo updated."));
    } catch (err) {
      dispatch(showError(normalizeApiError(err).message));
    } finally {
      setPickingPhoto(false);
    }
  };

  if (isLoading || isError) {
    return (
      <SharedLayout title="Edit profile" breadcrumbs={breadcrumbs}>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
        />
      </SharedLayout>
    );
  }

  const fullName = `${data?.first_name ?? ""} ${data?.last_name ?? ""}`.trim();

  return (
    <SharedLayout title="Edit profile" breadcrumbs={breadcrumbs}>
      <View className="items-center">
        <Avatar
          size="lg"
          name={fullName || data?.email}
          image={data?.avatar_url}
        />

        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          loading={pickingPhoto || uploadAvatar.isPending}
          onPress={() => void choosePhoto()}
          accessibilityLabel={
            data?.avatar_url ? "Change profile photo" : "Add a profile photo"
          }
        >
          {data?.avatar_url ? "Change photo" : "Add photo"}
        </Button>
      </View>

      <View className="mt-6">
        <Controller
          control={control}
          name="first_name"
          render={({ field }) => (
            <Field
              label="First name"
              autoCapitalize="words"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              {...chain.field("first_name")}
            />
          )}
        />

        <Controller
          control={control}
          name="last_name"
          render={({ field }) => (
            <Field
              label="Last name"
              autoCapitalize="words"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              {...chain.field("last_name")}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Field
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              {...chain.field("email")}
            />
          )}
        />

        <Controller
          control={control}
          name="tax_id"
          render={({ field }) => (
            <Field
              label="Tax ID"
              autoCapitalize="characters"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              {...chain.field("tax_id")}
            />
          )}
        />

        <Controller
          control={control}
          name="social_security_number"
          render={({ field }) => (
            <Field
              label="Social Security Number"
              hint="Shown masked elsewhere in the app."
              autoCapitalize="none"
              keyboardType="number-pad"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              {...chain.field(
                "social_security_number",
              )}
            />
          )}
        />
      </View>

      <Button
        fullWidth
        loading={update.isPending}
        onPress={save}
      >
        Save
      </Button>

      <Button
        variant="ghost"
        fullWidth
        className="mt-2"
        disabled={update.isPending}
        onPress={() => router.back()}
      >
        Cancel
      </Button>

      <Text variant="caption" tone="secondary" className="mt-4 text-center">
        Your photo is visible to the people you share a workspace with.
      </Text>
    </SharedLayout>
  );
}
