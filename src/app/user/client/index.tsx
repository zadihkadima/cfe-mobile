import { DashboardScreen } from "@/modules/dashboard/screens/DashboardScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function ClientDashboardPage() {
  return (
    <RouteGuard allowedRoles={["client", "admin"]}>
      <DashboardScreen />
    </RouteGuard>
  );
}