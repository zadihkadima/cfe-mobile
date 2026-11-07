import { useLocalSearchParams } from "expo-router";

import { CreateWorkspaceTaskScreen } from "@/modules/task/screens/CreateWorkspaceTaskScreen";

export default function WorkspaceTaskCreatePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <CreateWorkspaceTaskScreen workspaceId={id} />;
}
