import { ClientListScreen } from "@/modules/admin/screens/ClientListScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <ClientListScreen />
    </RouteGuard>
  );
}