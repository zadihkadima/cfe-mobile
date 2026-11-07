import { DashboardScreen } from "@/modules/dashboard/screens/DashboardScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function AdminDashboardPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <DashboardScreen />
    </RouteGuard>
  );
}