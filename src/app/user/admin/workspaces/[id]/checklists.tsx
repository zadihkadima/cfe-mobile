import { useLocalSearchParams } from "expo-router";

import { WorkspaceChecklistsScreen } from "@/modules/checklist/screens/WorkspaceChecklistsScreen";

export default function WorkspaceChecklistsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <WorkspaceChecklistsScreen workspaceId={id} />;
}
