import { ManagerClientListScreen } from "@/modules/manager/screens/ManagerClientListScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

/**
 * A manager's client list is their own: the server scopes it to the clients
 * assigned to the caller, so one manager never reads another's. The guard keeps
 * a client or an administrator out of the manager tree on a deep link; an
 * administrator gets the same work under `/user/admin/clients`.
 */
export default function Page() {
  return (
    <RouteGuard allowedRoles={["manager"]}>
      <ManagerClientListScreen />
    </RouteGuard>
  );
}
