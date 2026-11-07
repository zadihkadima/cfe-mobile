import { useLocalSearchParams } from "expo-router";

import { WorkspaceQuestionnairesScreen } from "@/modules/questionnaire/screens/WorkspaceQuestionnairesScreen";

export default function WorkspaceQuestionnairesPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <WorkspaceQuestionnairesScreen workspaceId={id} />;
}
