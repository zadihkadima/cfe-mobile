import { ManagerClientDetailScreen } from "@/modules/manager/screens/ManagerClientDetailScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["manager"]}>
      <ManagerClientDetailScreen />
    </RouteGuard>
  );
}
