import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

type Props = {
  /** What is being transferred. */
  name: string;

  /** 0 to 1, or null when the total is unknown. */
  progress: number | null;

  /** Shown before the file name, e.g. "Uploading". */
  verb?: string;
};

/**
 * A progress bar for a single file transfer.
 *
 * Uploads previously gave no feedback at all beyond a disabled button, so a
 * large file on a slow connection was indistinguishable from a frozen screen
 * -- and the usual response to that is to press the button again, which starts
 * a second upload of the same document.
 */
export function TransferProgressBar({ name, progress, verb = "Uploading" }: Props) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (progress === null) return;

    // Animated rather than set: progress events arrive in bursts as buffers
    // flush, and writing them straight to the width makes the bar jump in
    // large steps that read as stalling between them.
    Animated.timing(width, {
      toValue: progress,
      duration: 180,

      // Width cannot be driven natively, so this stays on the JS thread. It is
      // one interpolation on a screen that is otherwise idle while waiting.
      useNativeDriver: false,
    }).start();
  }, [progress, width]);

  const indeterminate = progress === null;

  return (
    <View className="mb-3 rounded-2xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
      <View className="mb-2 flex-row items-center justify-between">
        <Text
          className="flex-1 pr-3 text-sm font-semibold text-text dark:text-dark-text"
          numberOfLines={1}
        >
          {verb} {name}
        </Text>

        <Text className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary">
          {indeterminate ? "…" : `${Math.round(progress * 100)}%`}
        </Text>
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-border dark:bg-dark-border">
        {indeterminate ? (
          // A half-width fill rather than nothing. The size of the body is not
          // always known, and an empty track reads as zero progress rather
          // than as unmeasurable.
          <View className="h-full w-1/2 rounded-full bg-primary dark:bg-dark-primary" />
        ) : (
          <Animated.View
            className="h-full rounded-full bg-primary dark:bg-dark-primary"
            style={{
              width: width.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        )}
      </View>
    </View>
  );
}
