import { useCallback, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, View } from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import clsx from "clsx";

import { Text } from "../typography/Text";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange(value: T): void;
  accessibilityLabel?: string;
  className?: string;
}

/**
 * A small set of mutually exclusive choices, all visible at once.
 *
 * This is the right control when there are two to four options and the user
 * benefits from seeing the alternatives -- a date range, a status filter, a
 * view mode. Beyond four the labels truncate and it should become a menu.
 *
 * The thumb is a single animated layer that slides between positions rather
 * than a background toggled on each segment. Toggling backgrounds makes the
 * selection appear to teleport, and offers no sense of which direction the
 * choice moved; sliding it carries that information for free.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  className,
}: SegmentedControlProps<T>) {
  const [trackWidth, setTrackWidth] = useState(0);

  const offset = useSharedValue(0);

  // Kept in a ref as well as shared value: the layout callback needs the
  // current index to place the thumb correctly on first measure, before any
  // interaction has moved it.
  const index = options.findIndex((option) => option.value === value);
  const indexRef = useRef(index);
  indexRef.current = index;

  const segmentWidth = trackWidth > 0 ? trackWidth / options.length : 0;

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;

      setTrackWidth(width);

      // Placed without animation. Animating from zero on mount reads as the
      // control choosing an option by itself, which it did not.
      offset.value = (width / options.length) * Math.max(indexRef.current, 0);
    },
    [offset, options.length],
  );

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={onLayout}
      className={clsx(
        "h-11 flex-row rounded-2xl bg-surface-variant p-1 dark:bg-dark-surface-variant",
        className,
      )}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[{ width: segmentWidth - 8, pointerEvents: "none" }, thumbStyle]}
          className="absolute bottom-1 left-1 top-1 rounded-xl bg-surface dark:bg-dark-elevated"
        />
      ) : null}

      {options.map((option, position) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => {
              offset.value = withTiming(segmentWidth * position, { duration: 200 });

              onChange(option.value);
            }}
            className="flex-1 items-center justify-center"
          >
            <Text
              variant="label"
              tone={active ? "default" : "secondary"}
              weight={active ? "600" : "500"}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
