import { useLocalSearchParams } from "expo-router";

import { WorkspaceTasksScreen } from "@/modules/task/screens/WorkspaceTasksScreen";

export default function WorkspaceTasksPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <WorkspaceTasksScreen workspaceId={id} />;
}
