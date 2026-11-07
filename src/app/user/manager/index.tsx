import { DashboardScreen } from "@/modules/dashboard/screens/DashboardScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function ManagerDashboardPage() {
  return (
    <RouteGuard allowedRoles={["manager", "admin"]}>
      <DashboardScreen />
    </RouteGuard>
  );
}