import { ClientDetailScreen } from "@/modules/admin/screens/ClientDetailScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <ClientDetailScreen />
    </RouteGuard>
  );
}
