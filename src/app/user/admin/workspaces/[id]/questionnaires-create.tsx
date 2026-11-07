import { useLocalSearchParams } from "expo-router";

import { CreateWorkspaceQuestionnaireScreen } from "@/modules/questionnaire/screens/CreateWorkspaceQuestionnaireScreen";

export default function WorkspaceQuestionnaireCreatePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <CreateWorkspaceQuestionnaireScreen workspaceId={id} />;
}
