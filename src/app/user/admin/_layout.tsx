import { Slot } from "expo-router";

import { RouteGuard } from "@/core/components/RouteGuard";
import { AdminLayout } from "@/design-system/ui/layout/AdminLayout";

/**
 * The admin tree is administrators-only, and the guard sits on the layout so
 * every route beneath it is covered by default -- including the ones added
 * later, which a per-screen guard would miss until someone remembered to copy
 * the wrapper over.
 *
 * `RouteGuard` redirects a signed-in non-admin to their own role's dashboard
 * rather than rendering a refusal, so a stale deep link or a role change moves
 * the person somewhere they can act instead of somewhere they can only stare
 * at.
 */
export default function UserAdminLayout() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AdminLayout title="Admin">
        <Slot />
      </AdminLayout>
    </RouteGuard>
  );
}
