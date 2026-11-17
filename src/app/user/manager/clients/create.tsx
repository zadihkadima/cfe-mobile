import { ManagerClientCreateScreen } from "@/modules/manager/screens/ManagerClientCreateScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["manager"]}>
      <ManagerClientCreateScreen />
    </RouteGuard>
  );
}
