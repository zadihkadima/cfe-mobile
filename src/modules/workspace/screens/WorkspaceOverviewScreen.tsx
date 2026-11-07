import { Text, View } from "react-native";

import { QueryState } from "@/core/components/QueryState";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

import { Workspace } from "../api/types";
import { useWorkspaceClientDetails } from "../hooks/useWorkspaceClientDetails";
import { useWorkspaceMembers } from "../hooks/useWorkspaceMembers";

type Props = {
  workspace: Workspace;
};

function personName(firstName: string, lastName: string, email: string) {
  return `${firstName} ${lastName}`.trim() || email;
}

export function WorkspaceOverviewScreen({ workspace }: Props) {
  const client = useWorkspaceClientDetails(workspace.id);
  const members = useWorkspaceMembers(workspace.id);

  if (client.isLoading || members.isLoading || client.isError || members.isError) {
    return (
      <View className="flex-1 bg-background p-4 dark:bg-dark-background">
        <QueryState
          isLoading={client.isLoading || members.isLoading}
          isError={client.isError || members.isError}
          error={client.error ?? members.error}
          onRetry={() => {
            void client.refetch();
            void members.refetch();
          }}
        />
      </View>
    );
  }

  const managers = (members.data?.items ?? []).filter(
    (member) => member.role === "manager" && workspace.manager_ids.includes(member.id),
  );

  return (
    <ScreenScrollView>
      <View className="gap-4">
        <View className="rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
          <Text className="text-lg font-bold text-text dark:text-dark-text">Workspace details</Text>
          <View className="mt-4 gap-3">
            <View>
              <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Description</Text>
              <Text className="mt-1 text-text dark:text-dark-text">{workspace.description || "No description provided."}</Text>
            </View>
            <View>
              <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Start date</Text>
              <Text className="mt-1 text-text dark:text-dark-text">{new Date(workspace.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        <View className="rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
          <Text className="text-lg font-bold text-text dark:text-dark-text">Assigned client</Text>
          {client.data ? (
            <View className="mt-3">
              <Text className="font-semibold text-text dark:text-dark-text">{personName(client.data.first_name, client.data.last_name, client.data.email)}</Text>
              <Text className="mt-1 text-text-secondary dark:text-dark-text-secondary">{client.data.email}</Text>
            </View>
          ) : (
            <Text className="mt-3 text-text-secondary dark:text-dark-text-secondary">No client assigned.</Text>
          )}
        </View>

        <View className="rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
          <Text className="text-lg font-bold text-text dark:text-dark-text">Assigned managers</Text>
          {managers.length ? managers.map((manager) => (
            <View key={manager.id} className="mt-3 border-t border-border pt-3 first:border-t-0 first:pt-0 dark:border-dark-border">
              <Text className="font-semibold text-text dark:text-dark-text">{personName(manager.first_name, manager.last_name, manager.email)}</Text>
              <Text className="mt-1 text-text-secondary dark:text-dark-text-secondary">{manager.email}</Text>
            </View>
          )) : (
            <Text className="mt-3 text-text-secondary dark:text-dark-text-secondary">No managers assigned.</Text>
          )}
        </View>
      </View>
    </ScreenScrollView>
  );
}