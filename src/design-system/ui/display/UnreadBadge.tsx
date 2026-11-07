import { View } from "react-native";

import { Text } from "@/design-system/ui/typography/Text";

type Props = {
  count: number;

  /**
   * What the number is counting, for a screen reader -- "unread messages",
   * "outstanding tasks". A bare number read aloud says nothing.
   */
  label: string;
};

/**
 * A count of things waiting, sitting inline in a row or a tab.
 *
 * This is the flowed counterpart to `NotificationBadge`, which is absolutely
 * positioned to hang off the corner of an icon. That one cannot be used in a
 * list row: it would be pulled out of the layout and land on top of whatever
 * happened to be behind it.
 *
 * Renders nothing at zero rather than an empty circle, so a quiet list stays
 * quiet and the eye is drawn only to rows that want attention.
 *
 * Large counts are capped at "99+". The exact number stops being useful well
 * before that, and an unbounded one widens the pill until it pushes the rest
 * of the row out of place.
 */
export function UnreadBadge({ count, label }: Props) {
  if (count <= 0) {
    return null;
  }

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${count} ${label}`}
      className="h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 dark:bg-dark-danger"
    >
      <Text variant="caption" tone="inverted" weight="600">
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}
