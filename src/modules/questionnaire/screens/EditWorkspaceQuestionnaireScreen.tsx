import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";
import { QueryState } from "@/core/components/QueryState";

type Questionnaire = {
  id: string;
  title: string;
  description: string;
};

export function EditWorkspaceQuestionnaireScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id, questionnaireId } = useLocalSearchParams<{ id: string; questionnaireId: string }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["questionnaires", questionnaireId],
    queryFn: async () => {
      const { data } = await api.get<Questionnaire>(`/workspaces/${id}/questionnaires/${questionnaireId}`);
      return data;
    },
    enabled: !!id && !!questionnaireId,
  });

  useEffect(() => {
    if (!data) return;
    setTitle(data.title ?? "");
    setDescription(data.description ?? "");
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/workspaces/${id}/questionnaires/${questionnaireId}`, {
        title,
        description,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires.workspace(id ?? "") });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      router.back();
    },
  });

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

  return (
    <ScrollView
      className="flex-1 bg-background p-4 dark:bg-dark-background"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mb-4 text-2xl font-bold text-text dark:text-dark-text">Edit Questionnaire</Text>

      <Text className="mb-2 text-sm font-semibold text-text dark:text-dark-text">Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        className="mb-3 rounded-lg border border-border bg-surface px-3 py-2 text-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
      />

      <Text className="mb-2 text-sm font-semibold text-text dark:text-dark-text">Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        className="mb-4 rounded-lg border border-border bg-surface px-3 py-2 text-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
      />

      <Pressable
        className="rounded-lg bg-primary px-4 py-3"
        onPress={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        <Text className="text-center font-semibold text-background dark:text-dark-background">
          {saveMutation.isPending ? "Saving..." : "Save questionnaire"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
