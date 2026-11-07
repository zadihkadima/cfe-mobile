import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";
import { QueryState } from "@/core/components/QueryState";
import { DateField } from "@/design-system/ui/input/DateField";
import { AssigneePicker } from "@/modules/workspace/components/AssigneePicker";
import { useWorkspaceMembers } from "@/modules/workspace/hooks/useWorkspaceMembers";
import { PriorityPicker, StatusPicker } from "@/shared/components/StatusPicker";
import { toApiDate, toDateField, validateDateRange } from "@/shared/lib/scheduleDates";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to?: string | null;
  start_at?: string;
  due_at?: string;
};

export function EditWorkspaceTaskScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id, taskId } = useLocalSearchParams<{ id: string; taskId: string }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [startAt, setStartAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [status, setStatus] = useState("open");
  const [assignedTo, setAssignedTo] = useState("");

  const members = useWorkspaceMembers(id ?? "");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: async () => {
      const { data } = await api.get<Task>(`/workspaces/${id}/tasks/${taskId}`);
      return data;
    },
    enabled: !!id && !!taskId,
  });

  useEffect(() => {
    if (!data) return;
    setTitle(data.title ?? "");
    setDescription(data.description ?? "");
    setPriority(data.priority ?? "medium");
    setStatus(data.status ?? "open");
    setAssignedTo(data.assigned_to ?? "");
    setStartAt(toDateField(data.start_at));
    setDueAt(toDateField(data.due_at));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/workspaces/${id}/tasks/${taskId}`, {
        title,
        description,
        priority,
        status,
        assigned_to: assignedTo,
        // An empty picker sends "", which the API reads as a deliberate clear.
        // Sending null instead means "leave it alone", so a user who cleared a
        // date would watch it come straight back on the next load.
        start_at: toApiDate(startAt) ?? "",
        due_at: toApiDate(dueAt) ?? "",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.workspace(id ?? "") });
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
      <Text className="mb-4 text-2xl font-bold text-text dark:text-dark-text">Edit Task</Text>

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
        className="mb-3 rounded-lg border border-border bg-surface px-3 py-2 text-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
      />

      <StatusPicker value={status} onChange={setStatus} />

      <PriorityPicker value={priority} onChange={setPriority} />

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
        minimumDate={startAt ? new Date(`${startAt}T12:00:00`) : undefined}
        error={dateError ?? undefined}
      />

      <Pressable
        className="rounded-lg bg-primary px-4 py-3"
        onPress={() => {
          // Checked here so the user is told which date is wrong. The server
          // refuses an inverted pair too, but its message names neither field.
          const problem = validateDateRange(startAt, dueAt);

          setDateError(problem);

          if (!problem) {
            saveMutation.mutate();
          }
        }}
        disabled={saveMutation.isPending}
      >
        <Text className="text-center font-semibold text-background dark:text-dark-background">
          {saveMutation.isPending ? "Saving..." : "Save task"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
