import React, { useState } from "react";

import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";

import { useTheme } from "@/design-system/theme/useTheme";

import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";

import {
  Controller,
  useForm,
} from "react-hook-form";

import { SearchSelect } from "@/core/components/SearchSelect";
import { SearchMultiSelect } from "@/core/components/SearchMultiSelect";

import { useClients } from "@/modules/admin/hooks/client/useClients";
import { useManagers } from "@/modules/admin/hooks/manager/useManagers";
import { getClient } from "@/modules/admin/api/client/api";
import { getManager } from "@/modules/admin/api/manager/api";
import { useQueries, useQuery } from "@tanstack/react-query";

import { Client } from "@/modules/admin/api/client/types";
import { Manager } from "@/modules/admin/api/manager/types";

import {
  CreateWorkspaceRequest,
} from "../api/types";

import { useFieldChain } from "@/shared/hooks/useFieldChain";

type Props = {
  loading?: boolean;

  defaultValues?: CreateWorkspaceRequest;

  onSubmit: (
    data: CreateWorkspaceRequest
  ) => void;
};

export function WorkspaceForm({
  loading,
  defaultValues,
  onSubmit,
}: Props) {

  const [clientSearch, setClientSearch] =
    useState("");

  const { theme } = useTheme();
  const [managerSearch, setManagerSearch] =
    useState("");

  const [selectedClient, setSelectedClient] =
    useState<Client | null>(null);

  const [selectedManagers, setSelectedManagers] =
    useState<Manager[]>([]);

  const debouncedClientSearch = useDebouncedValue(clientSearch, 300);
  const debouncedManagerSearch = useDebouncedValue(managerSearch, 300);

  const {
    control,
    handleSubmit,
    setValue,
  } = useForm<CreateWorkspaceRequest>({
    defaultValues: defaultValues ?? {
      name: "",

      description: "",

      client_id: "",

      manager_ids: [],
    },
  });

  const chain = useFieldChain([
    "name",
    "description",
  ]);

  const { data: clients, isLoading: clientsLoading } =
    useClients({
      page: 1,
      limit: 10,
      search: debouncedClientSearch,
    });

  const { data: managers, isLoading: managersLoading } =
    useManagers({
      page: 1,
      limit: 10,
      search: debouncedManagerSearch,
    });

  const selectedClientQuery = useQuery({
    queryKey: ["workspace-form-client", defaultValues?.client_id],
    queryFn: ({ queryKey }) =>
      getClient(queryKey[1] as string),
    enabled: Boolean(defaultValues?.client_id),
  });

  const selectedManagerQueries = useQueries({
    queries: (defaultValues?.manager_ids ?? []).map((managerID) => ({
      queryKey: ["workspace-form-manager", managerID],
      queryFn: () => getManager(managerID),
      enabled: Boolean(managerID),
    })),
  });

  // Pre-populate selected client and managers when editing an existing
  // workspace. The query for clients/managers may arrive after the form's
  // default values, so set the local selected state when the lists load.
  React.useEffect(() => {
    const clientFromQuery = selectedClientQuery.data;
    const clientFromList = clients?.items?.find((client) => client.id === defaultValues?.client_id);
    const found = clientFromQuery || clientFromList;
    
    if (found && found.role === "client" && !selectedClient?.id) {
      setSelectedClient(found); 
    }
  }, [clients?.items, defaultValues?.client_id, selectedClientQuery.data, selectedClient?.id]);

  React.useEffect(() => {
    if (selectedManagers.length === 0 && defaultValues?.manager_ids?.length) {
      const found = selectedManagerQueries
        .map((query) => query.data)
        .filter((manager): manager is Manager => Boolean(manager));
      if (found.length === (defaultValues?.manager_ids?.length ?? 0) && found.length > 0) {
        setSelectedManagers(found);
      }
    }
  }, [defaultValues?.manager_ids, selectedManagers.length, selectedManagerQueries]);

  return (
    <View>

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextInput
            className="border border-border dark:border-dark-border rounded-lg p-3 mb-4 bg-surface dark:bg-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary"
            placeholder="Workspace name"
            value={field.value}
            onChangeText={field.onChange}
            placeholderTextColor={theme.colors.textMuted}
            {...chain.field("name")}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextInput
            className="border border-border dark:border-dark-border rounded-lg p-3 mb-4 bg-surface dark:bg-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary"
            placeholder="Description"
            value={field.value}
            onChangeText={field.onChange}
            placeholderTextColor={theme.colors.textMuted}
            {...chain.field(
              "description"
            )}
          />
        )}
      />

      <SearchSelect<Client>
        label="Client"

        value={selectedClient}

        search={clientSearch}

        onSearchChange={
          setClientSearch
        }

        loading={clientsLoading}

        items={clients?.items ?? []}

        getKey={(c) => c.id}

        getLabel={(c) =>
          `${c.first_name} ${c.last_name}`
        }

        getSubtitle={(c) =>
          c.email
        }

        onSelect={(client) => {

          setSelectedClient(client);

          setValue(
            "client_id",
            client.id
          );

          setClientSearch("");
        }}
      />

      <SearchMultiSelect<Manager>
        label="Managers"

        search={managerSearch}

        onSearchChange={
          setManagerSearch
        }

        loading={managersLoading}

        items={managers?.items ?? []}

        selected={selectedManagers}

        getKey={(m) => m.id}

        getLabel={(m) =>
          `${m.first_name} ${m.last_name}`
        }

        getSubtitle={(m) =>
          m.email
        }

        onAdd={(manager) => {

          const updated = [
            ...selectedManagers,
            manager,
          ];

          setSelectedManagers(updated);

          setValue(
            "manager_ids",
            updated.map(
              (m) => m.id
            )
          );

          setManagerSearch("");
        }}

        onRemove={(manager) => {

          const updated =
            selectedManagers.filter(
              (m) =>
                m.id !== manager.id
            );

          setSelectedManagers(updated);

          setValue(
            "manager_ids",
            updated.map(
              (m) => m.id
            )
          );
        }}
      />

      <TouchableOpacity
        className="mt-6 p-4 rounded-lg bg-text dark:bg-dark-text items-center disabled:opacity-50"
        disabled={loading}
        onPress={() => void handleSubmit(onSubmit)()}
      >
        <Text className="text-background dark:text-dark-background font-bold">
          Save Workspace
        </Text>
      </TouchableOpacity>

    </View>
  );
}