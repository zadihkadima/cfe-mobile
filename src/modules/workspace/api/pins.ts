import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";

type PinListResponse = {
  items: { workspace_id: string }[];
  total: number;
};

/**
 * The set of workspaces this person has pinned.
 *
 * Returned as a Set rather than a list, because every use is a membership
 * test. A list would make each row a linear scan of the whole set, which is
 * cheap at five workspaces and quietly is not at two hundred.
 */
export function usePinnedWorkspaces() {
  const query = useQuery({
    queryKey: queryKeys.workspacePins.all,
    queryFn: async () => {
      const { data } = await api.get<PinListResponse>("/workspace-pins");
      return data;
    },
  });

  return {
    ...query,
    pinnedIds: new Set((query.data?.items ?? []).map((pin) => pin.workspace_id)),
  };
}

export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      pinned,
    }: {
      workspaceId: string;
      pinned: boolean;
    }) => {
      if (pinned) {
        await api.delete(`/workspaces/${workspaceId}/pin`);
      } else {
        await api.put(`/workspaces/${workspaceId}/pin`);
      }
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workspacePins.all,
      });
    },
  });
}
