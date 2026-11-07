import { useState } from "react";

import { Pressable, Text, TextInput } from "react-native";
import { useTheme } from "@/design-system/theme/useTheme";


import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";
import { DateField } from "@/design-system/ui/input/DateField";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";
import { AssigneePicker } from "@/modules/workspace/components/AssigneePicker";
import { useWorkspaceMembers } from "@/modules/workspace/hooks/useWorkspaceMembers";
import { toApiDate, validateDateRange } from "@/shared/lib/scheduleDates";

export function CreateWorkspaceChecklistScreen({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Offered at creation rather than only in the edit screen. Raising a
  // checklist and then reopening it to say when it is due is two steps for one
  // thought, and the second step is the one people skip.
  const [startAt, setStartAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  // Empty means unassigned, which the API distinguishes from absent.
  const [assignedTo, setAssignedTo] = useState("");

  const members = useWorkspaceMembers(workspaceId);

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/workspaces/${workspaceId}/checklists`, {
        title,
        description,
        assigned_to: assignedTo || null,
        start_at: toApiDate(startAt),
        due_at: toApiDate(dueAt),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.checklists.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      router.back();
    },
  });

  return (
    <ScreenScrollView>
      <Text className="mb-4 text-2xl font-bold text-text dark:text-dark-text">Create Checklist</Text>

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Checklist title"
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

      <AssigneePicker
        label="Assigned to"
        members={members.data?.items ?? []}
        value={assignedTo}
        onChange={setAssignedTo}
        isLoading={members.isLoading}
      />

      <DateField
        label="Start date"
        value={startAt}
        onChange={(next) => {
          setStartAt(next);
          setDateError(null);
        }}
        placeholder="When work may begin"
      />

      <DateField
        label="Due date"
        value={dueAt}
        onChange={(next) => {
          setDueAt(next);
          setDateError(null);
        }}
        placeholder="When it must be finished"
        // Makes an impossible range unselectable rather than merely rejected.
        // `validateDateRange` still runs on submit, because the start date can
        // be changed after the due date is chosen.
        minimumDate={startAt ? new Date(`${startAt}T12:00:00`) : undefined}
        error={dateError ?? undefined}
      />

      <Pressable
        className="items-center rounded-lg bg-text px-3 py-3 dark:bg-dark-text"
        onPress={() => {
          const problem = validateDateRange(startAt, dueAt);

          setDateError(problem);

          if (!problem) {
            createMutation.mutate();
          }
        }}
        disabled={!title.trim() || createMutation.isPending}
      >
        <Text className="font-semibold text-background dark:text-dark-background">Save checklist</Text>
      </Pressable>
    </ScreenScrollView>
  );
}
