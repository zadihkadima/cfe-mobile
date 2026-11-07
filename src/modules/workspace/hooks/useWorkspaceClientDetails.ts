import { useQuery } from "@tanstack/react-query";

import { getWorkspaceClientDetails } from "@/modules/workspace/api/api";

export const useWorkspaceClientDetails = (
  workspaceId: string,
) => {
  return useQuery({
    queryKey: ["workspace-client-details", workspaceId],
    queryFn: () => getWorkspaceClientDetails(workspaceId),
    enabled: !!workspaceId,
  });
};
