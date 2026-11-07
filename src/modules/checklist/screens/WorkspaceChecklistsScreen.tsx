import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { MoreVertical } from "lucide-react-native";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "expo-router";

import { api } from "@/core/api/client";
import { useSeenWorkspaceWork } from "@/modules/notification/hooks/useSeenWorkspaceWork";
import { queryKeys } from "@/core/query/queryKeys";
import { QueryState } from "@/core/components/QueryState";
import { ActionMenu } from "@/core/components/ActionMenu";
import { Icon } from "@/design-system/ui";
import { useWorkspaceMembers } from "@/modules/workspace/hooks/useWorkspaceMembers";
import { memberDisplayName } from "@/modules/workspace/utils/memberDisplayName";
import { describeSchedule, isOverdue } from "@/shared/lib/schedule";

type Checklist = {
  id: string;
  title: string;
  description: string;
  status: string;
  start_at?: string;
  due_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  assigned_to?: string;
  created_by?: string;
  created_by_name?: string;
  items: { id: string; title: string; completed: boolean }[];
};

type ChecklistListResponse = {
  items: Checklist[];
  total: number;
};

export function WorkspaceChecklistsScreen({ workspaceId }: { workspaceId: string }) {
  // Cleared here rather than by whatever opened the screen, because a tab, a
  // deep link and a tapped notification all arrive at this same list.
  useSeenWorkspaceWork(workspaceId, ["checklist"]);

  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const members = useWorkspaceMembers(workspaceId);
  const [activeChecklistMenu, setActiveChecklistMenu] = useState<
    | {
        id: string;
        actions: {
          label: string;
          onPress(): void;
          destructive?: boolean;
          disabled?: boolean;
        }[];
      }
    | null
  >(null);

  const basePath = pathname.startsWith("/user/admin")
    ? `/user/admin/workspaces/${workspaceId}`
    : `/user/workspaces/${workspaceId}`;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.checklists.workspace(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<ChecklistListResponse>(`/workspaces/${workspaceId}/checklists`);
      return data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/workspaces/${workspaceId}/checklists/${id}`, {
        status: "completed",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.checklists.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/workspaces/${workspaceId}/checklists/${id}`, {
        status: "cancelled",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.checklists.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workspaces/${workspaceId}/checklists/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.checklists.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-background"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <View className="p-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text dark:text-dark-text">Checklists</Text>
          <Pressable
            className="rounded-lg border border-primary px-3 py-2"
            onPress={() => router.push(`${basePath}/checklists-create`)}
          >
            <Text className="font-semibold text-primary">Create</Text>
          </Pressable>
        </View>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!data?.items.length}
          emptyMessage="No checklists yet."
          onRetry={refetch}
        >
          {(data?.items ?? []).map((item) => (
            <View
              key={item.id}
              className="mb-3 rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface"
            >
              <View className="flex-row items-start justify-between">
                <Text className="text-base font-bold text-text dark:text-dark-text">{item.title}</Text>
                <Pressable
                  className="rounded-full p-2"
                  onPress={() =>
                    setActiveChecklistMenu({
                      id: item.id,
                      actions: [
                        ...(item.status !== "completed"
                          ? [
                              {
                                label: "Mark completed",
                                onPress: () => completeMutation.mutate(item.id),
                              },
                            ]
                          : []),
                        ...(item.status !== "cancelled" && item.status !== "deleted"
                          ? [
                              {
                                label: "Cancel",
                                onPress: () => cancelMutation.mutate(item.id),
                              },
                            ]
                          : []),
                        {
                          label: "Edit",
                          onPress: () => router.push(`${basePath}/checklists/${item.id}/edit`),
                        },
                        {
                          label: "Delete",
                          destructive: true,
                          onPress: () => deleteMutation.mutate(item.id),
                        },
                      ],
                    })
                  }
                >
                  <Icon as={MoreVertical} size="md" tone="secondary" />
                </Pressable>
              </View>
              {!!item.description && (
                <Text className="mt-1 text-text-secondary dark:text-dark-text-secondary">{item.description}</Text>
              )}
              <Text className="mt-2 text-xs text-text-secondary dark:text-dark-text-secondary">
                Status: {item.status} · Items: {item.items.length}
              </Text>
              {!!item.created_by && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Requested by: {memberDisplayName(members.data?.items ?? [], item.created_by, item.created_by_name)}
                </Text>
              )}
              {!!item.assigned_to && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Assigned to: {memberDisplayName(members.data?.items ?? [], item.assigned_to)}
                </Text>
              )}

              {/* Overdue is coloured because a date alone asks the reader to
                  compare it to today, which is the comparison they came here
                  to avoid. */}
              {item.start_at || item.due_at ? (
                <Text
                  className={
                    isOverdue(item)
                      ? "mt-1 text-xs font-semibold text-danger"
                      : "mt-1 text-xs text-text-secondary dark:text-dark-text-secondary"
                  }
                >
                  {describeSchedule(item)}
                </Text>
              ) : null}

              {!!item.completed_at && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Completed: {new Date(item.completed_at).toLocaleString()}
                </Text>
              )}

              {!!item.cancelled_at && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Cancelled: {new Date(item.cancelled_at).toLocaleString()}
                </Text>
              )}
            </View>
          ))}
        </QueryState>

        <ActionMenu
          visible={!!activeChecklistMenu}
          title="Checklist actions"
          actions={activeChecklistMenu?.actions ?? []}
          onClose={() => setActiveChecklistMenu(null)}
        />

      </View>
    </ScrollView>
  );
}
