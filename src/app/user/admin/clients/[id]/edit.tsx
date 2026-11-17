import { ClientEditScreen } from "@/modules/admin/screens/ClientEditScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <ClientEditScreen />
    </RouteGuard>
  );
}
