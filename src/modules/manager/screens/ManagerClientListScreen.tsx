import React from "react";

import { useRouter } from "expo-router";

import { useManagerClients } from "@/modules/manager/hooks/client/useManagerClients";
import { PersonRow } from "@/modules/admin/components/PersonRow";
import { PaginatedListScreen } from "@/core/components/PaginatedListScreen";
import { ManagerClient } from "@/modules/manager/api/client/types";
import { filterClientsBySearch } from "@/modules/admin/api/client/filterClients";

export function ManagerClientListScreen() {
  const router = useRouter();

  return (
    <PaginatedListScreen<ManagerClient>
      title="Clients"
      searchPlaceholder="Search clients"
      filterItems={filterClientsBySearch}
      useData={({ search, page }) =>
        useManagerClients({ page, limit: 20, search })
      }
      keyExtractor={(client) => client.id}
      renderItem={(client) => (
        <PersonRow
          person={client}
          onPress={() => router.push(`/user/manager/clients/${client.id}`)}
        />
      )}
      emptyTitle="No clients yet"
      emptyDescription="Add a client to start working with them."
      createLabel="Add client"
      onCreate={() => router.push("/user/manager/clients/create")}
    />
  );
}
