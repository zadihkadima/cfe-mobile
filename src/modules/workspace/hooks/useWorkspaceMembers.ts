import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";
import { getWorkspaceMembers } from "@/modules/workspace/api/api";

/**
 * The people work in a workspace can be assigned to.
 *
 * Membership changes rarely -- a client and two or three managers, edited when
 * the engagement is set up -- so this is cached for far longer than the
 * default. Refetching the same four names every time a form opens is a request
 * per keystroke of navigation for information that has not moved in months.
 */
export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.members(workspaceId),
    queryFn: () => getWorkspaceMembers(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}
