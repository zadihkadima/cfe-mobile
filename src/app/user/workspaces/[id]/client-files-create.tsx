import { useLocalSearchParams } from "expo-router";

import { CreateWorkspaceFileRequestScreen } from "@/modules/file-request/screens/CreateWorkspaceFileRequestScreen";

export default function WorkspaceClientFileRequestCreatePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <CreateWorkspaceFileRequestScreen workspaceId={id} />;
}
