import { useLocalSearchParams } from "expo-router";

import { CreateWorkspaceSignatureRequestScreen } from "@/modules/signature-request/screens/CreateWorkspaceSignatureRequestScreen";

export default function WorkspaceSignatureRequestCreatePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <CreateWorkspaceSignatureRequestScreen workspaceId={id} />;
}
