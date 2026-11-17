import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useWorkspaceClientDetails } from "@/modules/workspace/hooks/useWorkspaceClientDetails";
import { revealWorkspaceClientSsn } from "@/modules/workspace/api/ssn.api";
import { QueryState } from "@/core/components/QueryState";
import { RevealSsn } from "@/shared/components/RevealSsn";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

export function WorkspaceClientDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // The workspace the client belongs to, which the reveal endpoint is keyed
  // by. The same param that fetched the masked details authorizes the request
  // that would unmask them, so the two can never drift apart.
  const workspaceId = id;

  const { data, isLoading, isError, error, refetch } = useWorkspaceClientDetails(id);

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
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-background px-6">
        <Text className="text-text dark:text-dark-text">Client details not found.</Text>
      </View>
    );
  }

  return (
    <ScreenScrollView>
      <View className="rounded-xl border border-border dark:border-dark-border p-4 bg-surface dark:bg-dark-surface">
        <Text className="text-2xl font-bold text-text dark:text-dark-text">
          {data.first_name} {data.last_name}
        </Text>

        <Text className="mt-1 text-text-secondary dark:text-dark-text-secondary">
          {data.email}
        </Text>

        <View className="mt-5 gap-3">
          <View>
            <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Tax ID</Text>
            <Text className="text-text dark:text-dark-text font-semibold">{data.tax_id || "—"}</Text>
          </View>

          <View>
            <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Social Security Number</Text>
            <RevealSsn
              value={data.social_security_number}
              reveal={(password) =>
                revealWorkspaceClientSsn(workspaceId, password)
              }
            />
          </View>

          <View>
            <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Created</Text>
            <Text className="text-text dark:text-dark-text font-semibold">
              {new Date(data.created_at).toLocaleString()}
            </Text>
          </View>

          <View>
            <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Updated</Text>
            <Text className="text-text dark:text-dark-text font-semibold">
              {new Date(data.updated_at).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </ScreenScrollView>
  );
}
