import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useTheme } from "@/design-system/theme/useTheme";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";
import { QueryState } from "@/core/components/QueryState";

type Questionnaire = {
  id: string;
  title: string;
  description: string;
  status: string;
  questions: { id: string; prompt: string; required: boolean }[];
  answers: { question_id: string; value: string }[];
};

type QuestionnaireListResponse = {
  items: Questionnaire[];
};

export function WorkspaceQuestionnaireAnswerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id, questionnaireId } = useLocalSearchParams<{
    id: string;
    questionnaireId: string;
  }>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.questionnaires.workspace(id),
    queryFn: async () => {
      const response = await api.get<QuestionnaireListResponse>(`/workspaces/${id}/questionnaires`);
      return response.data;
    },
    enabled: !!id,
  });

  const questionnaire = useMemo(
    () => (data?.items ?? []).find((item) => item.id === questionnaireId),
    [data?.items, questionnaireId],
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const answerMutation = useMutation({
    mutationFn: async ({ questionId, value }: { questionId: string; value: string }) => {
      await api.patch(`/workspaces/${id}/questionnaires/${questionnaireId}`, {
        answer_question: {
          question_id: questionId,
          value,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires.workspace(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
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

  if (!questionnaire) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-background px-6">
        <Text className="text-text dark:text-dark-text">Questionnaire not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-background"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <View className="p-4">
        <Text className="text-2xl font-bold text-text dark:text-dark-text">{questionnaire.title}</Text>
        {!!questionnaire.description && (
          <Text className="mt-1 text-text-secondary dark:text-dark-text-secondary">{questionnaire.description}</Text>
        )}

        <Text className="mt-2 text-xs text-text-secondary dark:text-dark-text-secondary">
          Status: {questionnaire.status}
        </Text>

        {questionnaire.questions.map((question) => (
          <View
            key={question.id}
            className="mt-4 rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface"
          >
            <Text className="font-semibold text-text dark:text-dark-text">
              {question.prompt}
              {question.required ? " *" : ""}
            </Text>

            <TextInput
              className="mt-2 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
              placeholder="Type your answer"
              placeholderTextColor={theme.colors.textMuted}
              value={answers[question.id] ?? ""}
              onChangeText={(value) =>
                setAnswers((prev) => ({
                  ...prev,
                  [question.id]: value,
                }))
              }
            />

            <Pressable
              className="mt-3 items-center rounded-lg border border-primary px-3 py-2"
              onPress={() =>
                answerMutation.mutate({
                  questionId: question.id,
                  value: answers[question.id] ?? "",
                })
              }
              disabled={!(answers[question.id] ?? "").trim() || answerMutation.isPending}
            >
              <Text className="font-semibold text-primary">Submit Answer</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          className="mt-6 items-center rounded-lg bg-text px-3 py-3 dark:bg-dark-text"
          onPress={() => router.back()}
        >
          <Text className="font-semibold text-background dark:text-dark-background">Done</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
