import { useLocalSearchParams } from "expo-router";

import { WorkspaceIRSSubmissionsScreen } from "@/modules/irs-submission/screens/WorkspaceIRSSubmissionsScreen";

export default function WorkspaceIRSSubmissionsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <WorkspaceIRSSubmissionsScreen workspaceId={id} />;
}
