import { useLocalSearchParams } from "expo-router";
import { WorkspaceSignatureRequestsScreen } from "@/modules/signature-request/screens/WorkspaceSignatureRequestsScreen";

export default function WorkspaceSignaturesPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) return null;

  return <WorkspaceSignatureRequestsScreen workspaceId={id} />;
}
