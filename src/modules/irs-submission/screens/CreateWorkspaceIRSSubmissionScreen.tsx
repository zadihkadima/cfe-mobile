import { useState } from "react";

import { Pressable, Text, TextInput } from "react-native";
import { useTheme } from "@/design-system/theme/useTheme";


import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

export function CreateWorkspaceIRSSubmissionScreen({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const irsQueryKey = ["irs-submissions", workspaceId] as const;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taxYear, setTaxYear] = useState(`${new Date().getFullYear()}`);
  const [requestedFrom, setRequestedFrom] = useState("");
  const [dueAt, setDueAt] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/workspaces/${workspaceId}/irs-submissions`, {
        title,
        description,
        tax_year: Number.parseInt(taxYear, 10),
        requested_from: requestedFrom.trim() || undefined,
        due_at: dueAt.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: irsQueryKey });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      router.back();
    },
  });

  return (
    <ScreenScrollView>
      <Text className="mb-4 text-2xl font-bold text-text dark:text-dark-text">Create IRS Submission</Text>

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Submission title"
        placeholderTextColor={theme.colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Description"
        placeholderTextColor={theme.colors.textMuted}
        value={description}
        onChangeText={setDescription}
      />

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Tax year"
        placeholderTextColor={theme.colors.textMuted}
        value={taxYear}
        onChangeText={setTaxYear}
        keyboardType="numeric"
      />

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Requested from user ID (optional)"
        placeholderTextColor={theme.colors.textMuted}
        value={requestedFrom}
        onChangeText={setRequestedFrom}
      />

      <TextInput
        className="mb-4 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Due at (RFC3339, optional)"
        placeholderTextColor={theme.colors.textMuted}
        value={dueAt}
        onChangeText={setDueAt}
      />

      <Pressable
        className="items-center rounded-lg bg-text px-3 py-3 dark:bg-dark-text"
        onPress={() => createMutation.mutate()}
        disabled={!title.trim() || createMutation.isPending}
      >
        <Text className="font-semibold text-background dark:text-dark-background">Save submission</Text>
      </Pressable>
    </ScreenScrollView>
  );
}
