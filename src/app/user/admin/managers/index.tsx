import { ManagerListScreen } from "@/modules/admin/screens/ManagerListScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <ManagerListScreen />
    </RouteGuard>
  );
}
