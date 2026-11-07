import { forwardRef, useState, type ReactNode } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

import clsx from "clsx";

import { useColor } from "../../theme/useColor";
import { Text } from "../typography/Text";

export interface FieldProps extends Omit<TextInputProps, "placeholderTextColor"> {
  label: string;

  /**
   * Guidance shown before the user has done anything wrong. Kept distinct from
   * `error` so that help does not have to masquerade as a failure to be seen.
   */
  hint?: string;

  /**
   * The problem with the current value. Replaces the hint while present, so
   * the field never shows advice and a correction at the same time and force
   * the user to work out which one applies.
   */
  error?: string;

  /** Marks the field as required, and says so rather than only starring it. */
  required?: boolean;

  leading?: ReactNode;

  /**
   * An action at the trailing edge -- revealing a password, clearing a value.
   * Rendered inside the field's border so it reads as part of the control.
   */
  trailing?: ReactNode;

  containerClassName?: string;
}

/**
 * A labelled text input.
 *
 * Before this existed, every form built its own: a `Text` label, a bare
 * `TextInput` with a hand-written border, and an error message appended
 * wherever there was room. Across sixteen forms that produced sixteen
 * variations, and it is why `placeholderTextColor` appears as a literal hex
 * value in thirty places -- a colour prop cannot carry a `dark:` variant, so
 * each form picked a grey and none of them followed the theme.
 *
 * Three things are handled here that a hand-rolled input reliably forgets:
 *
 * The border reflects state. Focus and error are both drawn on the border
 * rather than as extra elements, so neither adds height -- a field that grows
 * when it fails pushes the rest of the form down at the exact moment the user
 * is reading it.
 *
 * The message row is always present. Reserving its height means validating a
 * field does not shift the fields below it, which is what makes inline
 * validation feel like the form is arguing back.
 *
 * The label is bound to the input. A screen reader reaches the control and
 * hears its name, its requirement and its error, none of which is conveyed by
 * a `Text` element that merely happens to sit above it.
 */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  {
    label,
    hint,
    error,
    required,
    leading,
    trailing,
    containerClassName,
    className,
    editable = true,
    secureTextEntry = false,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const placeholderColor = useColor("textMuted");

  const message = error ?? hint;

  return (
    <View className={clsx("mb-4", containerClassName)}>
      <View className="mb-2 flex-row items-baseline">
        <Text variant="label" tone={error ? "danger" : "secondary"}>
          {label}
        </Text>

        {required ? (
          <Text variant="caption" tone="muted" className="ml-1.5">
            Required
          </Text>
        ) : null}
      </View>

      <View
        className={clsx(
          "flex-row items-center rounded-2xl border px-4",
          "bg-surface dark:bg-dark-surface",
          error
            ? "border-danger dark:border-dark-danger"
            : focused
              ? "border-primary dark:border-dark-primary"
              : "border-border dark:border-dark-border",
          !editable && "opacity-60",
        )}
      >
        {leading ? <View className="mr-3">{leading}</View> : null}

        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={placeholderColor}
          accessibilityLabel={label}
          accessibilityHint={hint}
          accessibilityState={{ disabled: !editable }}
          // The multiline case needs the padding on the input rather than the
          // wrapper, or the text sits against the top edge as it grows.
          className={clsx(
            "flex-1 py-3.5 text-text dark:text-dark-text",
            props.multiline && "min-h-[96px] py-3",
            className,
          )}
          style={{ fontSize: 17, lineHeight: 22 }}
          secureTextEntry={secureTextEntry && !passwordVisible}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />

        {secureTextEntry ? (
          <Pressable
            className="ml-3 p-1"
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
          >
            {passwordVisible ? <EyeOff size={20} color={placeholderColor} /> : <Eye size={20} color={placeholderColor} />}
          </Pressable>
        ) : trailing ? <View className="ml-3">{trailing}</View> : null}
      </View>

      {/*
        Always rendered, even when empty. Mounting it only on failure makes the
        form jump by one line the first time a field is validated, and every
        field below it moves under the user's thumb.
      */}
      <View className="min-h-[20px] pt-1.5">
        {message ? (
          <Text variant="caption" tone={error ? "danger" : "muted"}>
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

export interface FieldButtonProps {
  label: string;
  value?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  trailing?: ReactNode;
  onPress(): void;
}

/**
 * A field whose value is chosen elsewhere -- a date, a picker, a sheet.
 *
 * It exists so that a tappable choice looks identical to a typed one. Forms
 * that style a picker as a button instead read as two different kinds of form
 * stacked on each other, and the user has to work out which rows they can type
 * into by tapping them.
 */
export function FieldButton({
  label,
  value,
  placeholder,
  error,
  required,
  trailing,
  onPress,
}: FieldButtonProps) {
  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-baseline">
        <Text variant="label" tone={error ? "danger" : "secondary"}>
          {label}
        </Text>

        {required ? (
          <Text variant="caption" tone="muted" className="ml-1.5">
            Required
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ?? placeholder ?? "Not set" }}
        className={clsx(
          "min-h-[52px] flex-row items-center justify-between rounded-2xl border px-4 py-3.5",
          "bg-surface dark:bg-dark-surface",
          error
            ? "border-danger dark:border-dark-danger"
            : "border-border dark:border-dark-border",
          "active:opacity-70",
        )}
      >
        <Text variant="body" tone={value ? "default" : "muted"} numberOfLines={1}>
          {value ?? placeholder ?? "Select"}
        </Text>

        {trailing}
      </Pressable>

      <View className="min-h-[20px] pt-1.5">
        {error ? (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
