import React from "react";

import { View } from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { WorkspaceForm } from "../components/WorkspaceForm";

import { useWorkspace } from "../hooks/useWorkspace";
import { useUpdateWorkspace } from "../hooks/useUpdateWorkspace";
import { QueryState } from "@/core/components/QueryState";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

export function WorkspaceEditScreen() {

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const {
    data: workspace,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkspace(id);

  const mutation =
    useUpdateWorkspace();

  if (isLoading || isError || !workspace) {
    return (
      <View className="flex-1 p-5 bg-background dark:bg-dark-background">
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
    <ScreenScrollView>

      <WorkspaceForm
        loading={mutation.isPending}
        defaultValues={{
          name: workspace.name,

          description:
            workspace.description,

          client_id:
            workspace.client_id,

          manager_ids:
            workspace.manager_ids,
        }}
        onSubmit={(data) => {

          mutation.mutate(
            {
              id,
              data,
            },
            {
              onSuccess() {
                router.back();
              },
            }
          );

        }}
      />

    </ScreenScrollView>
  );
}