import React from "react";

import { useRouter } from "expo-router";
import { useSelector } from "react-redux";

import { useManagers } from "@/modules/admin/hooks/manager/useManagers";
import { PersonRow } from "@/modules/admin/components/PersonRow";
import { PaginatedListScreen } from "@/core/components/PaginatedListScreen";
import { Manager } from "@/modules/admin/api/manager/types";
import { can } from "@/core/auth/permissions";
import { RootState } from "@/core/store";

export function ManagerListScreen() {
  const router = useRouter();

  // Only administrators may create managers. The route guard on the layout
  // already keeps this screen administrator-only; this keeps the button honest
  // even if a future route change opens the list to a wider audience.
  const role = useSelector(
    (state: RootState) => state.auth.user?.role
  );
  const canCreate =
    role != null && can(role, "managers.create");

  return (
    <PaginatedListScreen<Manager>
      title="Managers"
      searchPlaceholder="Search managers"
      useData={({ search, page }) =>
        useManagers({ page, limit: 20, search })
      }
      // The manager list previously had no keyExtractor at all, so React fell
      // back to array indices. On a paginated list that is a correctness bug
      // rather than a warning: page two reuses the keys of page one, so React
      // treats row three as the same element it was before and keeps the
      // previous row's state and any in-flight animation.
      keyExtractor={(manager) => manager.id}
      renderItem={(manager) => (
        <PersonRow
          person={manager}
          onPress={() => router.push(`/user/admin/managers/${manager.id}`)}
        />
      )}
      emptyTitle="No managers yet"
      emptyDescription="Add a manager so they can be assigned to client workspaces."
      createLabel={canCreate ? "Add manager" : undefined}
      onCreate={
        canCreate
          ? () => router.push("/user/admin/managers/create")
          : undefined
      }
    />
  );
}
