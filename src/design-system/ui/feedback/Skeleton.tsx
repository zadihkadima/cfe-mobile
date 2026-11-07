import { View } from "react-native";

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

import clsx from "clsx";

interface Props {

  /** Tailwind sizing and shape classes, e.g. "h-4 w-32 rounded-lg". */
  className?: string;

}

/**
 * A placeholder in the shape of the content that is loading.
 *
 * Every list in the app currently shows a centred spinner while it loads, which
 * has two costs. It gives no indication of what is arriving or how much, so the
 * wait feels open-ended; and the spinner occupies a different amount of space
 * than the content, so the screen jumps when data lands. A placeholder shaped
 * like the eventual content solves both — the layout is already correct when
 * the real thing replaces it, and the user can see the shape of what they are
 * waiting for.
 *
 * The pulse runs on the UI thread through Reanimated rather than the JavaScript
 * driver. This matters more than it sounds: the JavaScript thread is busy doing
 * the very work being waited on, so a JS-driven loading animation stutters
 * precisely when it is on screen, which reads as the app having hung.
 */
export function Skeleton({

  className,

}: Props) {

  const progress = useSharedValue(0);

  useEffect(() => {

    progress.value = withRepeat(

      withTiming(1, {
        duration: 900,
        easing: Easing.inOut(Easing.quad),
      }),

      // -1 repeats indefinitely; `true` reverses each cycle so the pulse eases
      // back rather than snapping to its start, which would read as a flicker.
      -1,
      true,
    );

  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({

    // Kept deliberately shallow. A placeholder that pulses to near-invisible
    // competes with the real content for attention and makes a fast load look
    // like a flash of broken layout.
    opacity: 0.55 + progress.value * 0.35,

  }));

  return (

    <Animated.View

      style={animatedStyle}

      // Announced as busy so a screen reader says the region is loading rather
      // than reading out a row of empty boxes.
      accessibilityRole="progressbar"

      accessibilityLabel="Loading"

      className={clsx(

        "bg-skeleton",

        "dark:bg-dark-skeleton",

        "rounded-lg",

        className,

      )}

    />

  );

}

interface GroupProps {

  /** How many placeholder rows to render. */
  count?: number;

  className?: string;

}

/**
 * A stack of placeholder rows, for a list whose length is not yet known.
 *
 * The count is a guess and should be roughly what a full screen holds. Too few
 * and the screen still jumps when data arrives; too many and the user is
 * promised more than they have.
 */
export function SkeletonList({

  count = 5,

  className,

}: GroupProps) {

  return (

    <View className={clsx("gap-3", className)}>

      {Array.from({ length: count }).map((_, index) => (

        <View

          key={index}

          className="flex-row items-center gap-3 px-1 py-3"

        >

          <Skeleton className="h-10 w-10 rounded-full" />

          <View className="flex-1 gap-2">

            <Skeleton className="h-4 w-1/2" />

            <Skeleton className="h-3 w-3/4" />

          </View>

        </View>

      ))}

    </View>

  );

}

/**
 * Placeholders for a list of cards rather than a list of rows.
 *
 * A row skeleton standing in for cards is worse than no skeleton at all: the
 * screen settles into thin rows, then rearranges itself into tall cards the
 * moment data lands, which is the layout shift the placeholder existed to
 * prevent. The shape of the placeholder has to match the shape of the wait.
 */
export function SkeletonCards({ count = 3, className }: GroupProps) {
  return (
    <View className={clsx("gap-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className="rounded-3xl border border-border p-5 dark:border-dark-border"
        >
          <View className="flex-row items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-2xl" />

            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </View>
          </View>

          <View className="mt-4 gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </View>
        </View>
      ))}
    </View>
  );
}
