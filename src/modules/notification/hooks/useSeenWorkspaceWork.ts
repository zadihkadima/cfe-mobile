import { useEffect, useRef } from "react";

import type { UnreadKind } from "../api/types";
import { useMarkWorkspaceKindRead } from "./useMarkWorkspaceKindRead";
import { useUnread } from "./useUnread";

/**
 * Clears the badges for the work a screen is showing.
 *
 * Called by the module screens themselves rather than by whatever opened them,
 * because there is more than one door: a workspace tab, a deep link, and a tap
 * on a notification all end up at the same list. Clearing at the tab left the
 * other two routes showing work the reader was looking at while the badge
 * still claimed it was unseen -- and since only the tab could clear it, the
 * count could survive being read any number of times.
 *
 * Several kinds because a screen is a place, not a type: the client files list
 * shows stored files and requests for files, and reading it means both.
 */
export function useSeenWorkspaceWork(
  workspaceId: string | undefined,
  kinds: UnreadKind[],
) {
  const unread = useUnread();
  const markRead = useMarkWorkspaceKindRead();

  /*
   * Which kinds have already been cleared for this visit.
   *
   * Without it this fires again on every render that follows the counts
   * changing -- and clearing a badge changes the counts, so it would answer
   * its own condition and keep sending receipts until the count settled.
   *
   * Keyed by workspace so that moving between workspaces without unmounting
   * still clears the new one.
   */
  const cleared = useRef<{ workspaceId?: string; kinds: Set<string> }>({
    kinds: new Set(),
  });

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    if (cleared.current.workspaceId !== workspaceId) {
      cleared.current = { workspaceId, kinds: new Set() };
    }

    for (const kind of kinds) {
      if (cleared.current.kinds.has(kind)) {
        continue;
      }

      // Only what is actually waiting. A receipt for an empty kind is a
      // request that cannot change anything.
      if (unread.forWorkspaceKind(workspaceId, kind) === 0) {
        continue;
      }

      cleared.current.kinds.add(kind);
      markRead.mutate({ workspaceId, kind });
    }
    // `kinds` is a literal at every call site, so it is a new array each
    // render; depending on it directly would re-run this constantly. Its
    // contents are what matter, and they are fixed per screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, kinds.join(","), unread, markRead]);
}
