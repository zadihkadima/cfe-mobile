import { ClientCreateScreen } from "@/modules/admin/screens/ClientCreationScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <ClientCreateScreen />
    </RouteGuard>
  );
}
