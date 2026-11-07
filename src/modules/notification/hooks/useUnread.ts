import { useCallback, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

import { queryKeys } from "@/core/query/queryKeys";
import { RootState } from "@/core/store";

import { getUnreadByWorkspace } from "../api/api";
import type { UnreadKind, UnreadSummary } from "../api/types";

/**
 * How much unseen work is waiting, and where.
 *
 * This is the single source for every badge in the app: the header icons, each
 * workspace row, the dashboard cards and the tabs inside a workspace.
 *
 * It replaces the same filter written out in four separate files, each of which
 * counted `message.created` rows in the notification list. That was wrong in a
 * way nobody would notice: the list is capped at fifty rows server-side, so the
 * number quietly stopped growing for exactly the person a badge is meant to
 * help. Counting now happens in the database.
 */
export function useUnread() {
  const signedIn = useSelector((state: RootState) => !!state.auth.user);
  const hydrated = useSelector((state: RootState) => state.auth.hydrated);

  const query = useQuery({
    queryKey: queryKeys.notifications.unreadByWorkspace,
    queryFn: getUnreadByWorkspace,
    enabled: hydrated && signedIn,
  });

  /*
   * Normalised before anything reads into it.
   *
   * A badge is not worth a blank screen. This hook is called from the app
   * header, so it renders on essentially every route -- a response missing
   * `items` or `by_kind` would throw during render and take the whole app
   * down, which is exactly the failure that `SharedLayout` shipped with. The
   * shape is guaranteed by the server today, but nothing here should depend
   * on that: an error body, a proxy, or an older build all produce something
   * else.
   */
  const summary: UnreadSummary = useMemo(
    () => ({
      items: query.data?.items ?? [],
      total: query.data?.total ?? 0,
      by_kind: query.data?.by_kind ?? {},
    }),
    [query.data],
  );

  // Indexed once rather than scanning the array per row. A workspace list
  // renders this for every row, and a linear search inside a list item turns
  // drawing twenty rows into four hundred comparisons.
  const byWorkspace = useMemo(() => {
    const index = new Map<string, UnreadSummary["items"][number]>();

    for (const item of summary.items) {
      index.set(item.workspace_id, item);
    }

    return index;
  }, [summary.items]);

  /** How much is waiting in one workspace, across everything in it. */
  const forWorkspace = useCallback(
    (workspaceId: string | undefined) =>
      workspaceId ? (byWorkspace.get(workspaceId)?.total ?? 0) : 0,
    [byWorkspace],
  );

  /** How much is waiting behind one tab of one workspace. */
  const forWorkspaceKind = useCallback(
    (workspaceId: string | undefined, kind: UnreadKind) =>
      workspaceId
        ? (byWorkspace.get(workspaceId)?.by_kind?.[kind] ?? 0)
        : 0,
    [byWorkspace],
  );

  /** How much is waiting of one kind, everywhere. This is the header badge. */
  const forKind = useCallback(
    (kind: UnreadKind) => summary.by_kind[kind] ?? 0,
    [summary.by_kind],
  );

  /** Which workspaces have anything waiting at all, newest count first. */
  const workspacesWithUnread = useMemo(
    () => summary.items.filter((item) => item.total > 0),
    [summary.items],
  );

  return {
    total: summary.total,
    forWorkspace,
    forWorkspaceKind,
    forKind,
    workspacesWithUnread,
    isLoading: query.isLoading,
  };
}
