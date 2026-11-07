import React from "react";
import { useRouter } from "expo-router";
import { useManagers } from "@/modules/admin/hooks/manager/useManagers";
import { PaginatedListScreen } from "@/core/components/PaginatedListScreen";
import { PersonRow } from "@/modules/admin/components/PersonRow";
import { resendInvite } from "@/modules/admin/api/users";
import { Manager } from "@/modules/admin/api/manager/types";

export function PendingManagersScreen() {
  const router = useRouter();

  return (
    <PaginatedListScreen<Manager>
      title="Pending Manager Invites"
      searchPlaceholder="Search invited managers"
      useData={({ search, page }) =>
        useManagers({ page, limit: 20, search, invited: true })
      }
      keyExtractor={(m) => m.id}
      renderItem={(m) => (
        <PersonRow
          person={m}
          onPress={() => router.push(`/user/admin/managers/${m.id}`)}
          onResend={async (id) => await resendInvite(id)}
        />
      )}
      emptyTitle="No pending invites"
      emptyDescription="No outstanding invitations for managers."
    />
  );
}
