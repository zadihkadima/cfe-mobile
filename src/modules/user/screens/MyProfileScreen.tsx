import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { useMyProfile } from "@/modules/user/hooks/useMyProfile";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";
import { QueryState } from "@/core/components/QueryState";
import { MaskedValue } from "@/design-system/ui/display/MaskedValue";
import { Avatar, CopyableId } from "@/design-system/ui";

export function MyProfileScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useMyProfile();

  if (isLoading || isError) {
    return (
      <View className="flex-1 bg-background p-4 dark:bg-dark-background">
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
        />
      </View>
    );
  }

  if (!data) {
    return (
      <SharedLayout title="Profile">
        <View className="flex-1 items-center justify-center bg-background dark:bg-dark-background px-6">
          <Text className="text-text dark:text-dark-text">Profile not found.</Text>
        </View>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout
      title="Profile"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Profile" },
      ]}
    >
      <View className="rounded-xl border border-border dark:border-dark-border p-4 bg-surface dark:bg-dark-surface">
        <View className="flex-row items-center">
          <Avatar
            size="lg"
            name={`${data.first_name} ${data.last_name}`.trim() || data.email}
            image={data.avatar_url}
          />

          <View className="ml-3 flex-1">
            <Text className="text-2xl font-bold text-text dark:text-dark-text">
              {data.first_name} {data.last_name}
            </Text>

            <Text className="mt-1 text-text-secondary dark:text-dark-text-secondary">
              {data.email}
            </Text>

            {/* Quoted when contacting support, which is the one case where
                someone needs to identify their own account to another
                person. */}
            <View className="mt-1 flex-row">
              <CopyableId id={data.id} label="Account" />
            </View>
          </View>
        </View>

        <View className="mt-5 gap-3">
          <View>
            <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Role</Text>
            <Text className="text-text dark:text-dark-text font-semibold capitalize">{data.role}</Text>
          </View>

          <View>
            <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Tax ID</Text>
            <Text className="text-text dark:text-dark-text font-semibold">{data.tax_id || "—"}</Text>
          </View>

          <View>
            <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Social Security Number</Text>
            <MaskedValue value={data.social_security_number} />
          </View>

          <View>
            <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Updated</Text>
            <Text className="text-text dark:text-dark-text font-semibold">
              {new Date(data.updated_at).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        className="mt-5 bg-text dark:bg-dark-text rounded-lg p-4 items-center"
        onPress={() => router.push("/user/profile/edit")}
      >
        <Text className="text-background dark:text-dark-background font-semibold">Edit Profile</Text>
      </TouchableOpacity>
    </SharedLayout>
  );
}
