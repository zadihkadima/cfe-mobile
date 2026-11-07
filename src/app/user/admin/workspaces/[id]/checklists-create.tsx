import { useLocalSearchParams } from "expo-router";

import { CreateWorkspaceChecklistScreen } from "@/modules/checklist/screens/CreateWorkspaceChecklistScreen";

export default function WorkspaceChecklistCreatePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <CreateWorkspaceChecklistScreen workspaceId={id} />;
}
