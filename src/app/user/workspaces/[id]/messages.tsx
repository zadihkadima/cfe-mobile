import { useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";

import { tokenService } from "@/core/auth/tokenService";
import { RootState } from "@/core/store";
import { WorkspaceMessageScreen } from "@/modules/message/screens/WorkspaceMessagesScreen";
import { useWorkspace } from "@/modules/workspace/hooks/useWorkspace";

export default function WorkspaceMessagesPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = tokenService.getAccessToken();
  const { data: workspace } = useWorkspace(id);

  if (!id || !user || !token) {
    return null;
  }

  return (
    <WorkspaceMessageScreen
      workspaceId={id}
      workspaceName={workspace?.name}
      token={token}
      currentUserId={user.id}
    />
  );
}