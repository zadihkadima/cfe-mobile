import { RouteGuard } from "@/core/components/RouteGuard";
import { LockedAccountsScreen } from "@/modules/admin/screens/LockedAccountsScreen";

export default function LockedAccountsPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <LockedAccountsScreen />
    </RouteGuard>
  );
}