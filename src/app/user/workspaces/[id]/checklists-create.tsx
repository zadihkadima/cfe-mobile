import { useLocalSearchParams } from "expo-router";

import { CreateWorkspaceChecklistScreen } from "@/modules/checklist/screens/CreateWorkspaceChecklistScreen";

/**
 * The manager-side twin of the admin create route. See tasks-create for why
 * only the admin copy existed.
 */
export default function WorkspaceChecklistCreatePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <CreateWorkspaceChecklistScreen workspaceId={id} />;
}
