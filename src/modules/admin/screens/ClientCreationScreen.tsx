import React from "react";

import {
  Text,
} from "react-native";
import { useDispatch } from "react-redux";

import { useRouter } from "expo-router";

import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";
import { ClientForm } from "@/modules/admin/components/client/ClientForm";
import type { CreateClientFormData } from "@/modules/admin/schemas/createClientSchema";

import { useCreateClient } from "@/modules/admin/hooks/client/useCreateClient";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { showError, showSuccess } from "@/core/store/notificationSlice";

export function ClientCreateScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const createClient =
    useCreateClient();

  // The handler is explicitly typed rather than `any`. It was `any` before,
  // which is how the form came to submit PascalCase field names to an endpoint
  // expecting snake_case without anything failing to compile.
  const onSubmit = (data: CreateClientFormData) => {
    createClient.mutate(data, {
      onSuccess: () => {
        dispatch(showSuccess("Client created successfully."));

        router.replace(
          "/user/admin/clients"
        );
      },

      onError: (error: any) => {
        const appError = normalizeApiError(error);
        dispatch(showError(appError.message));
      },
    });
  };

  return (
    <ScreenScrollView>
      <Text className="text-3xl font-bold text-text dark:text-dark-text mb-6">
        Create Client
      </Text>

      <ClientForm
        loading={
          createClient.isPending
        }
        submitText="Create Client"
        onSubmit={onSubmit}
      />
    </ScreenScrollView>
  );
}