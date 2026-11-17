import { ManagerEditScreen } from "@/modules/admin/screens/ManagerEditScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <ManagerEditScreen />
    </RouteGuard>
  );
}
