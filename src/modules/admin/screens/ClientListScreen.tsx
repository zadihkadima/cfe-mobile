import React from "react";

import { useRouter } from "expo-router";

import { useClients } from "@/modules/admin/hooks/client/useClients";
import { PersonRow } from "@/modules/admin/components/PersonRow";
import { PaginatedListScreen } from "@/core/components/PaginatedListScreen";
import { Client } from "@/modules/admin/api/client/types";

export function ClientListScreen() {
  const router = useRouter();

  return (
    <PaginatedListScreen<Client>
      title="Clients"
      searchPlaceholder="Search clients"
      useData={({ search, page }) =>
        useClients({ page, limit: 20, search })
      }
      keyExtractor={(client) => client.id}
      renderItem={(client) => (
        <PersonRow
          person={client}
          onPress={() => router.push(`/user/admin/clients/${client.id}`)}
        />
      )}
      emptyTitle="No clients yet"
      emptyDescription="Invite a client to give them access to their workspace."
      createLabel="Add client"
      onCreate={() => router.push("/user/admin/clients/create")}
    />
  );
}
