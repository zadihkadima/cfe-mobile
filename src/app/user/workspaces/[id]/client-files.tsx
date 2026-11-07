import { useLocalSearchParams } from "expo-router";
import { WorkspaceFileRequestsScreen } from "@/modules/file-request/screens/WorkspaceFileRequestsScreen";

export default function WorkspaceClientFilesPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return null;

  return <WorkspaceFileRequestsScreen workspaceId={id} />;
}
