import { useState } from "react";

import { Pressable, Text, TextInput } from "react-native";
import { useTheme } from "@/design-system/theme/useTheme";


import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

export function CreateWorkspaceFileRequestScreen({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/workspaces/${workspaceId}/file-requests`, {
        title,
        description,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.fileRequests.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      router.back();
    },
  });

  return (
    <ScreenScrollView>
      <Text className="mb-4 text-2xl font-bold text-text dark:text-dark-text">Create File Request</Text>

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Request title"
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

      <Pressable
        className="items-center rounded-lg bg-text px-3 py-3 dark:bg-dark-text"
        onPress={() => createMutation.mutate()}
        disabled={!title.trim() || createMutation.isPending}
      >
        <Text className="font-semibold text-background dark:text-dark-background">Save request</Text>
      </Pressable>
    </ScreenScrollView>
  );
}
