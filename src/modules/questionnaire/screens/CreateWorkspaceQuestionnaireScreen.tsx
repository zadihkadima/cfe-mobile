import { useState } from "react";

import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useTheme } from "@/design-system/theme/useTheme";


import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";

export function CreateWorkspaceQuestionnaireScreen({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [questions, setQuestions] = useState<{ prompt: string; type: string; required: boolean }[]>([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/workspaces/${workspaceId}/questionnaires`, {
        title,
        description,
        questions,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      router.back();
    },
  });

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-background"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <View className="p-4">
      <Text className="mb-4 text-2xl font-bold text-text dark:text-dark-text">Create Questionnaire</Text>

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Questionnaire title"
        placeholderTextColor={theme.colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        className="mb-4 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Description"
        placeholderTextColor={theme.colors.textMuted}
        value={description}
        onChangeText={setDescription}
      />

      <Text className="mb-2 text-base font-semibold text-text dark:text-dark-text">Questions</Text>
      <TextInput
        className="mb-2 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Question prompt"
        placeholderTextColor={theme.colors.textMuted}
        value={questionPrompt}
        onChangeText={setQuestionPrompt}
      />

      <View className="mb-4 flex-row gap-2">
        <Pressable
          className="rounded-lg border border-primary px-3 py-2"
          onPress={() => {
            if (!questionPrompt.trim()) {
              return;
            }
            setQuestions((prev) => [
              ...prev,
              {
                prompt: questionPrompt.trim(),
                type: "text",
                required: true,
              },
            ]);
            setQuestionPrompt("");
          }}
        >
          <Text className="font-semibold text-primary">Add Required Question</Text>
        </Pressable>
      </View>

      {questions.map((question, index) => (
        <View
          key={`${question.prompt}-${index}`}
          className="mb-2 rounded-lg border border-border p-3 dark:border-dark-border"
        >
          <Text className="text-sm text-text dark:text-dark-text">{index + 1}. {question.prompt}</Text>
        </View>
      ))}

      <Pressable
        className="items-center rounded-lg bg-text px-3 py-3 dark:bg-dark-text"
        onPress={() => createMutation.mutate()}
        disabled={!title.trim() || createMutation.isPending}
      >
        <Text className="font-semibold text-background dark:text-dark-background">Save questionnaire</Text>
      </Pressable>
      </View>
    </ScrollView>
  );
}
