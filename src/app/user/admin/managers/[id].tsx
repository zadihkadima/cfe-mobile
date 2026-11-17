import { ManagerDetailScreen } from "@/modules/admin/screens/ManagerDetailScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <ManagerDetailScreen />
    </RouteGuard>
  );
}
