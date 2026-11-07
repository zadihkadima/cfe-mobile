import type { ComponentType } from "react";
import { Modal, Pressable, View } from "react-native";

import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";
import type { LucideProps } from "lucide-react-native";

import { Icon } from "../display/Icon";
import { Text } from "../typography/Text";

export interface DialogProps {
  visible: boolean;

  title: string;
  message?: string;

  icon?: ComponentType<LucideProps>;

  confirmLabel?: string;
  cancelLabel?: string;

  /**
   * Marks the confirming action as destructive. This colours the action and,
   * more importantly, is announced -- "Delete, button" and a red button say
   * the same thing to different people.
   */
  destructive?: boolean;

  busy?: boolean;

  onConfirm(): void;
  onCancel(): void;
}

/**
 * A decision the user must make before anything else continues.
 *
 * This replaces `Alert.alert`, which the app reached for whenever something
 * needed confirming. The platform alert cannot be themed, ignores the app's
 * type scale entirely, and renders identically for "Sign out" and "Delete
 * permanently" -- so the one action that genuinely warrants a pause looks the
 * same as the one that does not.
 *
 * The cancelling action is listed first and given equal visual weight. Placing
 * the destructive action under the thumb, styled as the obvious choice, is how
 * confirmation dialogs get dismissed without being read.
 */
export function Dialog({
  visible,
  title,
  message,
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: DialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          className="absolute inset-0"
        >
          <Pressable
            onPress={busy ? undefined : onCancel}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            className="flex-1 bg-scrim dark:bg-dark-scrim"
          />
        </Animated.View>

        <Animated.View
          entering={ZoomIn.duration(180).withInitialValues({ transform: [{ scale: 0.94 }] })}
          exiting={ZoomOut.duration(140)}
          accessibilityViewIsModal
          accessibilityRole="alert"
          className="w-full rounded-3xl bg-elevated p-6 dark:bg-dark-elevated"
        >
          {icon ? (
            <View
              className={`mb-4 h-12 w-12 items-center justify-center rounded-full ${
                destructive
                  ? "bg-danger-subtle dark:bg-dark-danger-subtle"
                  : "bg-primary-subtle dark:bg-dark-primary-subtle"
              }`}
            >
              <Icon as={icon} size="lg" tone={destructive ? "danger" : "primary"} />
            </View>
          ) : null}

          <Text variant="heading">{title}</Text>

          {message ? (
            <Text variant="body" tone="secondary" className="mt-2">
              {message}
            </Text>
          ) : null}

          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              className="h-12 flex-1 items-center justify-center rounded-2xl border border-border active:opacity-70 dark:border-dark-border"
            >
              <Text variant="label">{cancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ disabled: busy, busy }}
              className={`h-12 flex-1 items-center justify-center rounded-2xl active:opacity-70 ${
                destructive ? "bg-danger dark:bg-dark-danger" : "bg-primary dark:bg-dark-primary"
              } ${busy ? "opacity-60" : ""}`}
            >
              <Text variant="label" tone="inverted" weight="600">
                {busy ? "Working…" : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
