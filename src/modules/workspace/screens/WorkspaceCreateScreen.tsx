import React from "react";

import { useRouter } from "expo-router";

import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";

import { WorkspaceForm } from "../components/WorkspaceForm";

import { useCreateWorkspace } from "../hooks/useCreateWorkspace";

export function WorkspaceCreateScreen() {

  const router = useRouter();

  const mutation =
    useCreateWorkspace();

  return (
    <ScreenScrollView>

      <WorkspaceForm
        loading={mutation.isPending}
        onSubmit={(data) => {

          mutation.mutate(
            data,
            {
              onSuccess: () => {
                router.back();
              },
            }
          );

        }}
      />

    </ScreenScrollView>
  );
}