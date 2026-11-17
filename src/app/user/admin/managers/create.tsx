import { ManagerCreateScreen } from "@/modules/admin/screens/ManagerCreateScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <ManagerCreateScreen />
    </RouteGuard>
  );
}
