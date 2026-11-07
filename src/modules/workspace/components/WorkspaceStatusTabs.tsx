import { ScrollView, View } from "react-native";

import clsx from "clsx";

import { PressableScale } from "@/design-system/ui";
import { Text } from "@/design-system/ui/typography/Text";

import {
  WORKSPACE_STATUSES,
  WORKSPACE_STATUS_LABELS,
  WorkspaceStatus,
} from "../lib/status";

/** "All" is not a status; it is the absence of a filter. */
export type StatusFilter = WorkspaceStatus | "all";

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },

  ...WORKSPACE_STATUSES.map((status) => ({
    value: status,
    label: WORKSPACE_STATUS_LABELS[status],
  })),
];

/**
 * The status filter for the workspace list.
 *
 * Tabs rather than the dropdown used elsewhere. Five options is within what a
 * row can show, and the point of a filter people use constantly is that the
 * alternatives are visible: with a dropdown, seeing which status you are
 * looking at costs a tap, and seeing what else exists costs another.
 *
 * The row scrolls horizontally because five labels do not fit across a narrow
 * phone. Wrapping them onto a second line was the alternative and is worse --
 * the header would change height as labels reflow, and the list below would
 * shift under the reader's thumb.
 *
 * The counts deliberately are not shown. The API returns a total for the
 * current filter only, so a count per tab would need four more requests on
 * every visit, and a stale or missing one on a tab is worse than no number at
 * all: it invites arithmetic that does not add up.
 */
export function WorkspaceStatusTabs({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange(value: StatusFilter): void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Otherwise the first tap on a tab only dismisses the keyboard, and the
      // reader has to tap the same tab twice.
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-2 pr-5"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value;

        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            // The selection is carried by colour alone, which does not exist
            // for a screen reader and is unreliable for anyone who cannot
            // distinguish the two shades.
            accessibilityState={{ selected }}
            scaleTo={0.96}
          >
            <View
              className={clsx(
                "rounded-full border px-3.5 py-1.5",
                selected
                  ? "border-primary bg-primary dark:border-dark-primary dark:bg-dark-primary"
                  : "border-border bg-surface dark:border-dark-border dark:bg-dark-surface",
              )}
            >
              <Text
                variant="label"
                className={
                  selected
                    ? "text-white"
                    : "text-text-secondary dark:text-dark-text-secondary"
                }
              >
                {option.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}
