import {
  WorkspaceCreateScreen,
} from "@/modules/workspace/screens/WorkspaceCreateScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    // Managers start workspaces too; the guard keeps the route closed to
    // clients, who have no business creating one.
    <RouteGuard allowedRoles={["manager", "admin"]}>
      <WorkspaceCreateScreen />
    </RouteGuard>
  );
}
