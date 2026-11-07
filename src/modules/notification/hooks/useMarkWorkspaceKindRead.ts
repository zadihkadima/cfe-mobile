import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/queryKeys";

import { markWorkspaceKindRead } from "../api/api";
import type { UnreadKind, UnreadSummary } from "../api/types";
import { clearKind } from "../utils/clearKind";

/**
 * Clear one workspace tab's badge, which is what opening that tab means.
 *
 * The count is corrected optimistically as well as refetched. Without that the
 * badge lingers for the length of a round trip, which reads as the tap not
 * having worked and invites a second tap.
 *
 * Failure is deliberately quiet. Nothing the reader asked for has been lost --
 * they are looking at the tab either way -- and a toast complaining about a
 * read receipt would be noise about something they never requested. The badge
 * reappears on the next refetch, which is the honest outcome.
 */
export function useMarkWorkspaceKindRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      kind,
    }: {
      workspaceId: string;
      kind: UnreadKind;
    }) => markWorkspaceKindRead(workspaceId, kind),

    onMutate: ({ workspaceId, kind }) => {
      queryClient.setQueryData<UnreadSummary>(
        queryKeys.notifications.unreadByWorkspace,
        (previous) =>
          previous ? clearKind(previous, workspaceId, kind) : previous,
      );
    },

    // Both on success and on failure. A failed receipt has to put the badge
    // back, and the server is the only thing that knows what it should say.
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}
