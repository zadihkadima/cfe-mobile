import React from "react";
import { useRouter } from "expo-router";
import { useClients } from "@/modules/admin/hooks/client/useClients";
import { PaginatedListScreen } from "@/core/components/PaginatedListScreen";
import { PersonRow } from "@/modules/admin/components/PersonRow";
import { resendInvite } from "@/modules/admin/api/users";
import { Client } from "@/modules/admin/api/client/types";

export function PendingClientsScreen() {
  const router = useRouter();

  return (
    <PaginatedListScreen<Client>
      title="Pending Client Invites"
      searchPlaceholder="Search invited clients"
      useData={({ search, page }) =>
        useClients({ page, limit: 20, search, invited: true })
      }
      keyExtractor={(client) => client.id}
      renderItem={(client) => (
        <PersonRow
          person={client}
          onPress={() => router.push(`/user/admin/clients/${client.id}`)}
          onResend={async (id) => await resendInvite(id)}
        />
      )}
      emptyTitle="No pending invites"
      emptyDescription="No outstanding invitations for clients."
    />
  );
}
