import { WorkspaceListScreen } from "@/modules/workspace/screens/WorkspaceListScreen";
import { RouteGuard } from "@/core/components/RouteGuard";

export default function Page() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <WorkspaceListScreen />
    </RouteGuard>
  );
}