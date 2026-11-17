import { ManagerClientEditScreen } from "@/modules/manager/screens/ManagerClientEditScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["manager"]}>
      <ManagerClientEditScreen />
    </RouteGuard>
  );
}
