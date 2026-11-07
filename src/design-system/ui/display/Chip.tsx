import type { ComponentType, ReactNode } from "react";
import { Pressable, View } from "react-native";

import clsx from "clsx";
import type { LucideProps } from "lucide-react-native";

import { Icon } from "../display/Icon";
import { Text } from "../typography/Text";

export type ChipTone = "neutral" | "primary" | "success" | "warning" | "danger";

const chipTones: Record<
  ChipTone,
  { fill: string; selectedFill: string; text: string; selectedText: string }
> = {
  neutral: {
    fill: "bg-surface-variant dark:bg-dark-surface-variant",
    selectedFill: "bg-primary dark:bg-dark-primary",
    text: "text-text-secondary dark:text-dark-text-secondary",
    selectedText: "text-text-inverted dark:text-dark-text-inverted",
  },
  primary: {
    fill: "bg-primary-subtle dark:bg-dark-primary-subtle",
    selectedFill: "bg-primary dark:bg-dark-primary",
    text: "text-primary dark:text-dark-primary",
    selectedText: "text-text-inverted dark:text-dark-text-inverted",
  },
  success: {
    fill: "bg-success-subtle dark:bg-dark-success-subtle",
    selectedFill: "bg-success dark:bg-dark-success",
    text: "text-success dark:text-dark-success",
    selectedText: "text-text-inverted dark:text-dark-text-inverted",
  },
  warning: {
    fill: "bg-warning-subtle dark:bg-dark-warning-subtle",
    selectedFill: "bg-warning dark:bg-dark-warning",
    text: "text-warning dark:text-dark-warning",
    selectedText: "text-text-inverted dark:text-dark-text-inverted",
  },
  danger: {
    fill: "bg-danger-subtle dark:bg-dark-danger-subtle",
    selectedFill: "bg-danger dark:bg-dark-danger",
    text: "text-danger dark:text-dark-danger",
    selectedText: "text-text-inverted dark:text-dark-text-inverted",
  },
};

export interface ChipProps {
  label: string;

  /** Whether the chip is currently applied. Only meaningful when `onPress` is set. */
  selected?: boolean;

  tone?: ChipTone;

  icon?: ComponentType<LucideProps>;

  /** Omit to render a static tag rather than a filter. */
  onPress?(): void;

  className?: string;
}

/**
 * A compact, tappable label: a filter, a facet, a status tag.
 *
 * Chips were being written inline as a `View` with a rounded class and a small
 * `Text`, which is how the same filter row ended up 28pt tall on one screen
 * and 34 on another -- both below the 44pt minimum that makes a target
 * reliably tappable. The height here is fixed at 36 with generous hit slop
 * rather than padding, so a row of chips stays visually compact while
 * remaining comfortable to hit.
 *
 * Selection is shown by filling the chip, not by adding a border. A border
 * appearing on selection changes the chip's width, so selecting one filter
 * nudges every filter after it sideways.
 */
export function Chip({
  label,
  selected = false,
  tone = "neutral",
  icon,
  onPress,
  className,
}: ChipProps) {
  const palette = chipTones[tone];

  const body = (
    <View
      className={clsx(
        "h-9 flex-row items-center rounded-full px-3.5",
        selected ? palette.selectedFill : palette.fill,
        className,
      )}
    >
      {icon ? (
        <View className="mr-1.5">
          <Icon as={icon} size="sm" tone={selected ? "inverted" : "secondary"} />
        </View>
      ) : null}

      <Text
        variant="label"
        className={selected ? palette.selectedText : palette.text}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      // The chip is 36pt tall to keep a filter row compact; the slop restores
      // a 44pt target without adding the height back.
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      className="active:opacity-70"
    >
      {body}
    </Pressable>
  );
}

export interface ChipGroupProps {
  children: ReactNode;
  className?: string;
}

/** Lays chips out in a wrapping row with even spacing on both axes. */
export function ChipGroup({ children, className }: ChipGroupProps) {
  return <View className={clsx("flex-row flex-wrap gap-2", className)}>{children}</View>;
}
