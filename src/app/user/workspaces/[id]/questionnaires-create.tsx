import { useLocalSearchParams } from "expo-router";

import { CreateWorkspaceQuestionnaireScreen } from "@/modules/questionnaire/screens/CreateWorkspaceQuestionnaireScreen";

/**
 * The manager-side twin of the admin create route. See tasks-create for why
 * only the admin copy existed.
 */
export default function WorkspaceQuestionnaireCreatePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <CreateWorkspaceQuestionnaireScreen workspaceId={id} />;
}
