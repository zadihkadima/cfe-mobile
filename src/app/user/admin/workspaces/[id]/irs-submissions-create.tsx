import { useLocalSearchParams } from "expo-router";

import { CreateWorkspaceIRSSubmissionScreen } from "@/modules/irs-submission/screens/CreateWorkspaceIRSSubmissionScreen";

export default function WorkspaceIRSSubmissionCreatePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <CreateWorkspaceIRSSubmissionScreen workspaceId={id} />;
}
