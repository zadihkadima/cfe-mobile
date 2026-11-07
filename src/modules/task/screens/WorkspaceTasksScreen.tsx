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
import { ActionMenu } from "@/core/components/ActionMenu";
import { QueryState } from "@/core/components/QueryState";
import { Icon } from "@/design-system/ui";
import { useWorkspaceMembers } from "@/modules/workspace/hooks/useWorkspaceMembers";
import { memberDisplayName } from "@/modules/workspace/utils/memberDisplayName";

import { describeSchedule, isOverdue } from "@/shared/lib/schedule";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  client_id: string;
  manager_id: string;
  assigned_to?: string;
  start_at?: string;
  due_at?: string;
  completed_at?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
};

type TaskListResponse = {
  items: Task[];
  total: number;
};

export function WorkspaceTasksScreen({ workspaceId }: { workspaceId: string }) {
  // Reading the list is what "seen" means, and it is cleared here rather than
  // by whatever opened the screen: a tab, a deep link and a tapped
  // notification all arrive at this same list.
  useSeenWorkspaceWork(workspaceId, ["task"]);

  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const members = useWorkspaceMembers(workspaceId);
  const [activeTaskMenu, setActiveTaskMenu] = useState<
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
    queryKey: queryKeys.tasks.workspace(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<TaskListResponse>(`/workspaces/${workspaceId}/tasks`);
      return data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.patch(`/workspaces/${workspaceId}/tasks/${taskId}`, {
        status: "completed",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/workspaces/${workspaceId}/tasks/${taskId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const tasks = data?.items ?? [];

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-background"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <View className="p-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text dark:text-dark-text">Tasks</Text>
          <Pressable
            className="rounded-lg border border-primary px-3 py-2"
            onPress={() => router.push(`${basePath}/tasks-create`)}
          >
            <Text className="font-semibold text-primary">Create</Text>
          </Pressable>
        </View>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={tasks.length === 0}
          emptyMessage="No tasks yet."
          onRetry={refetch}
        >
          {tasks.map((task) => (
          <View
            key={task.id}
            className="mb-3 rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface"
          >
            <View className="flex-row items-start justify-between">
              <Text className="text-base font-bold text-text dark:text-dark-text">{task.title}</Text>
              <Pressable
                className="rounded-full p-2"
                onPress={() =>
                  setActiveTaskMenu({
                    id: task.id,
                    actions: [
                      ...(task.status !== "completed"
                        ? [
                            {
                              label: "Mark completed",
                              onPress: () => completeMutation.mutate(task.id),
                            },
                          ]
                        : []),
                      {
                        label: "Edit",
                        onPress: () => router.push(`${basePath}/tasks/${task.id}/edit`),
                      },
                      {
                        label: "Delete",
                        destructive: true,
                        onPress: () => deleteMutation.mutate(task.id),
                      },
                    ],
                  })
                }
              >
                <Icon as={MoreVertical} size="md" tone="secondary" />
              </Pressable>
            </View>
            {!!task.description && (
              <Text className="mt-1 text-text-secondary dark:text-dark-text-secondary">{task.description}</Text>
            )}
            <Text className="mt-2 text-xs text-text-secondary dark:text-dark-text-secondary">
              Status: {task.status}
            </Text>
            {!!task.created_by && (
              <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                Requested by: {memberDisplayName(members.data?.items ?? [], task.created_by, task.created_by_name)}
              </Text>
            )}
            {!!task.assigned_to && (
              <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                Assigned to: {memberDisplayName(members.data?.items ?? [], task.assigned_to)}
              </Text>
            )}

            {/* The dates were stored but never shown, so a deadline set by a
                manager was invisible to the client it was set for. Overdue is
                coloured because a date alone asks the reader to compare it to
                today, which is the comparison they came here to avoid. */}
            {task.start_at || task.due_at ? (
              <Text
                className={
                  isOverdue(task)
                    ? "mt-1 text-xs font-semibold text-danger"
                    : "mt-1 text-xs text-text-secondary dark:text-dark-text-secondary"
                }
              >
                {describeSchedule(task)}
              </Text>
            ) : null}

            {!!task.completed_at && (
              <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                Completed: {new Date(task.completed_at).toLocaleString()}
              </Text>
            )}
          </View>
          ))}
        </QueryState>
      </View>

      <ActionMenu
        visible={!!activeTaskMenu}
        title="Task actions"
        actions={activeTaskMenu?.actions ?? []}
        onClose={() => setActiveTaskMenu(null)}
      />
    </ScrollView>
  );
}
