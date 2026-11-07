import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import clsx from "clsx";

import { Text } from "../typography/Text";

export interface BottomSheetProps {
  visible: boolean;
  onClose(): void;

  title?: string;

  /** Secondary line under the title, for context the title cannot carry. */
  description?: string;

  children: ReactNode;

  /**
   * Whether the body scrolls. Leave off for short, fixed content; a scroll
   * view around three rows adds a bounce that suggests there is more below.
   */
  scrollable?: boolean;

  className?: string;
}

/**
 * A panel that rises from the bottom of the screen.
 *
 * Sheets are the right home for a secondary choice on a phone: they appear
 * next to the thumb rather than in the middle of the screen, they keep the
 * originating context visible behind them, and they are dismissed by a
 * downward movement that matches the direction they arrived from.
 *
 * The scrim is a real pressable rather than a decorative overlay, because
 * tapping outside is the gesture people try first. The close button remains
 * for anyone who cannot reach it -- a sheet dismissable only by an outside tap
 * is unusable to a screen reader, which has no notion of "outside".
 *
 * Entry and exit are animated in opposite directions so the sheet appears to
 * return to where it came from. Fading it out in place makes it read as having
 * been destroyed rather than put away.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  description,
  children,
  scrollable = false,
  className,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  const Body = scrollable ? ScrollView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          className="absolute inset-0"
        >
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="flex-1 bg-scrim dark:bg-dark-scrim"
          />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(260).dampingRatio(0.9)}
          exiting={SlideOutDown.duration(200)}
          style={{ paddingBottom: insets.bottom + 16 }}
          className={clsx(
            "rounded-t-[28px] bg-elevated px-5 pt-3 dark:bg-dark-elevated",
            "max-h-[88%]",
            className,
          )}
        >
          {/*
            The grabber is decorative and hidden from assistive technology: it
            signals draggability to sighted users and would otherwise be
            announced as an unlabelled element with no action behind it.
          */}
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="mb-3 h-1 w-10 self-center rounded-full bg-border dark:bg-dark-border"
          />

          {title ? (
            <View className="mb-4 pr-2">
              <Text variant="heading">{title}</Text>

              {description ? (
                <Text variant="caption" tone="secondary" className="mt-1">
                  {description}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Body {...(scrollable ? { showsVerticalScrollIndicator: false } : {})}>{children}</Body>
        </Animated.View>
      </View>
    </Modal>
  );
}
