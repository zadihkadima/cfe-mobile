import { useLocalSearchParams } from "expo-router";

import { CreateWorkspaceTaskScreen } from "@/modules/task/screens/CreateWorkspaceTaskScreen";

/**
 * The manager-side twin of the admin create route.
 *
 * The tasks screen builds its own paths from the current one, so a manager
 * viewing /user/workspaces/:id/tasks sends Create to
 * /user/workspaces/:id/tasks-create. Only the admin copy of that file existed,
 * so the button reached not-found for every non-admin.
 */
export default function WorkspaceTaskCreatePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <CreateWorkspaceTaskScreen workspaceId={id} />;
}
