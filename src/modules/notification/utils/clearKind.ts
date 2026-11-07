import type { UnreadKind, UnreadSummary } from "../api/types";

/**
 * The counts as they will be once one workspace tab has been read.
 *
 * Applied before the request is sent so the badge disappears on the tap rather
 * than a round trip later. A badge that lingers reads as the tap not having
 * worked, and invites a second one.
 *
 * The totals are adjusted by the amount actually cleared rather than
 * recomputed, because this summary is the only copy the client holds -- there
 * is nothing else to recompute from.
 */
export function clearKind(
  summary: UnreadSummary,
  workspaceId: string,
  kind: UnreadKind,
): UnreadSummary {
  const cleared = summary.items.find(
    (item) => item.workspace_id === workspaceId,
  )?.by_kind[kind];

  // Nothing was waiting, so nothing changes. Returning the same object rather
  // than an equal one lets React skip the re-render.
  if (!cleared) {
    return summary;
  }

  return {
    ...summary,

    // Floored at zero. The arithmetic should never go negative, but a count
    // that has drifted must not turn into a badge reading "-2", which is a
    // worse failure than a stale number.
    total: Math.max(summary.total - cleared, 0),

    by_kind: {
      ...summary.by_kind,
      [kind]: Math.max((summary.by_kind[kind] ?? 0) - cleared, 0),
    },

    items: summary.items.map((item) =>
      item.workspace_id === workspaceId
        ? {
            ...item,
            total: Math.max(item.total - cleared, 0),
            by_kind: { ...item.by_kind, [kind]: 0 },
          }
        : item,
    ),
  };
}
