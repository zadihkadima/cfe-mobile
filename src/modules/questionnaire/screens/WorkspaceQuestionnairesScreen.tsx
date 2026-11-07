import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MoreVertical } from "lucide-react-native";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "expo-router";
import { useSelector } from "react-redux";

import { RootState } from "@/core/store";

import { api } from "@/core/api/client";
import { useSeenWorkspaceWork } from "@/modules/notification/hooks/useSeenWorkspaceWork";
import { queryKeys } from "@/core/query/queryKeys";
import { QueryState } from "@/core/components/QueryState";
import { ActionMenu } from "@/core/components/ActionMenu";
import { Icon } from "@/design-system/ui";

type Questionnaire = {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to?: string;
  completed_at?: string;
  questions: { id: string; prompt: string; type: string }[];
};

type QuestionnaireListResponse = {
  items: Questionnaire[];
  total: number;
};

export function WorkspaceQuestionnairesScreen({ workspaceId }: { workspaceId: string }) {
  // Cleared here rather than by whatever opened the screen, because a tab, a
  // deep link and a tapped notification all arrive at this same list.
  useSeenWorkspaceWork(workspaceId, ["questionnaire"]);

  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const [activeQuestionnaireMenu, setActiveQuestionnaireMenu] = useState<
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

  const canCreate = user?.role === "admin";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.questionnaires.workspace(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<QuestionnaireListResponse>(`/workspaces/${workspaceId}/questionnaires`);
      return data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/workspaces/${workspaceId}/questionnaires/${id}`, { status: "sent" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/workspaces/${workspaceId}/questionnaires/${id}`, { status: "cancelled" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workspaces/${workspaceId}/questionnaires/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires.workspace(workspaceId) });
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
          <Text className="text-2xl font-bold text-text dark:text-dark-text">Questionnaires</Text>
          {canCreate ? (
            <Pressable
              className="rounded-lg border border-primary px-3 py-2"
              onPress={() => router.push(`${basePath}/questionnaires-create`)}
            >
              <Text className="font-semibold text-primary">Create</Text>
            </Pressable>
          ) : null}
        </View>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!data?.items.length}
          emptyMessage="No questionnaires yet."
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
                    setActiveQuestionnaireMenu({
                      id: item.id,
                      actions: [
                        {
                          label: "Open answer flow",
                          onPress: () => router.push(`${basePath}/questionnaires/${item.id}/answer`),
                        },
                        ...(item.status === "draft"
                          ? [
                              {
                                label: "Mark sent",
                                onPress: () => sendMutation.mutate(item.id),
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
                          onPress: () => router.push(`${basePath}/questionnaires/${item.id}/edit`),
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
                Status: {item.status} · Questions: {item.questions.length}
              </Text>

              {!!item.completed_at && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Completed: {new Date(item.completed_at).toLocaleString()}
                </Text>
              )}
            </View>
          ))}
        </QueryState>

        <ActionMenu
          visible={!!activeQuestionnaireMenu}
          title="Questionnaire actions"
          actions={activeQuestionnaireMenu?.actions ?? []}
          onClose={() => setActiveQuestionnaireMenu(null)}
        />

      </View>
    </ScrollView>
  );
}
