import type { ComponentType, ReactNode } from "react";
import { ActivityIndicator, Pressable, View, type PressableStateCallbackType } from "react-native";

import clsx from "clsx";
import type { LucideProps } from "lucide-react-native";

import { useColor } from "../../theme/useColor";
import { Icon } from "../display/Icon";
import { Text, type TextProps } from "../typography/Text";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  children: ReactNode;

  variant?: ButtonVariant;

  size?: ButtonSize;

  /** A glyph before the label, for actions whose icon is well established. */
  icon?: ComponentType<LucideProps>;

  loading?: boolean;

  disabled?: boolean;

  /** Stretches to fill the row. A form's primary action usually should. */
  fullWidth?: boolean;

  onPress?(): void;

  accessibilityLabel?: string;

  className?: string;
}

const sizeStyles: Record<ButtonSize, { box: string; text: TextProps["variant"] }> = {
  // No size drops below 44pt. `sm` is a *narrower* button, not a shorter one;
  // treating the two as the same thing is how the app ended up with 32pt-tall
  // actions that are awkward to hit and fail the platform's own guidance.
  sm: { box: "h-11 px-4 rounded-xl", text: "label" },
  md: { box: "h-12 px-5 rounded-2xl", text: "label" },
  lg: { box: "h-14 px-6 rounded-2xl", text: "body" },
};

const variantStyles: Record<
  ButtonVariant,
  {
    box: string;
    tone: TextProps["tone"];
    iconTone: "inverted" | "default" | "primary";
  }
> = {
  primary: {
    box: "bg-primary dark:bg-dark-primary",
    tone: "inverted",
    iconTone: "inverted",
  },
  secondary: {
    box: "bg-surface dark:bg-dark-surface border border-border dark:border-dark-border",
    tone: "default",
    iconTone: "default",
  },
  ghost: {
    box: "bg-transparent",
    tone: "primary",
    iconTone: "primary",
  },
  danger: {
    box: "bg-danger dark:bg-dark-danger",
    tone: "inverted",
    iconTone: "inverted",
  },
};

/**
 * Every button in the application.
 *
 * Three components were doing this job -- `Button`, `SecondaryButton` and an
 * `IconButton` nothing imported -- alongside an inline pattern repeated on
 * most screens. They had drifted in every respect that matters: different
 * heights, different corner radii, different pressed opacities, and a label
 * colour of literal white, which is wrong against the dark theme's much
 * lighter primary fill.
 *
 * Collapsing them into variants of one component is not merely tidier. It is
 * the only way these stay true everywhere at once:
 *
 * A busy button keeps its size. Swapping the label for a spinner collapsed the
 * button to the spinner's width mid-submit, moving whatever sat beside it at
 * the exact moment the user was watching for a result. Here the label stays
 * laid out and is only made invisible, so the width holds.
 *
 * A disabled button says so. Fifty percent opacity conveys nothing to a screen
 * reader, which would otherwise offer a control that silently does nothing.
 *
 * The spinner matches the label. It is drawn in whatever colour the label
 * would have been, so it stays legible on a dark fill and on a light one.
 */
export function Button({
  children,
  variant = "primary",
  size = "lg",
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  onPress,
  accessibilityLabel,
  className,
}: ButtonProps) {
  const styles = variantStyles[variant];
  const dimensions = sizeStyles[size];

  const isDisabled = disabled || loading;

  const spinnerColor = useColor(
    variant === "primary" || variant === "danger" ? "textInverted" : "primary",
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={clsx(
        "flex-row items-center justify-center",
        dimensions.box,
        styles.box,
        fullWidth ? "w-full" : "self-start",
        isDisabled && "opacity-50",
        className,
      )}
      style={({ pressed }: PressableStateCallbackType) => (pressed ? { opacity: 0.7 } : null)}
    >
      <View
        className={clsx("flex-row items-center", loading && "opacity-0")}
        accessibilityElementsHidden={loading}
      >
        {icon ? (
          <View className="mr-2">
            <Icon as={icon} size={size === "sm" ? "sm" : "md"} tone={styles.iconTone} />
          </View>
        ) : null}

        <Text variant={dimensions.text} tone={styles.tone} weight="600" numberOfLines={1}>
          {children}
        </Text>
      </View>

      {loading ? (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator color={spinnerColor} size="small" />
        </View>
      ) : null}
    </Pressable>
  );
}
