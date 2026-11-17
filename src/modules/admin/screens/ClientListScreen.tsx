import React from "react";

import { useRouter } from "expo-router";
import { useSelector } from "react-redux";

import { useClients } from "@/modules/admin/hooks/client/useClients";
import { PersonRow } from "@/modules/admin/components/PersonRow";
import { PaginatedListScreen } from "@/core/components/PaginatedListScreen";
import { Client } from "@/modules/admin/api/client/types";
import { filterClientsBySearch } from "@/modules/admin/api/client/filterClients";
import { can } from "@/core/auth/permissions";
import { RootState } from "@/core/store";

export function ClientListScreen() {
  const router = useRouter();

  // The create control is shown only where the caller may use it. The route
  // guard above already keeps this screen administrator-only, so this reads as
  // defense in depth rather than as the enforcement itself.
  const role = useSelector(
    (state: RootState) => state.auth.user?.role
  );
  const canCreate =
    role != null && can(role, "clients.create");

  return (
    <PaginatedListScreen<Client>
      title="Clients"
      searchPlaceholder="Search clients"
      filterItems={filterClientsBySearch}
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
      createLabel={canCreate ? "Add client" : undefined}
      onCreate={
        canCreate
          ? () => router.push("/user/admin/clients/create")
          : undefined
      }
    />
  );
}
