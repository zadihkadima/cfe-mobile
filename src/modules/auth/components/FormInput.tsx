import React, { forwardRef, useId, useState } from "react";
import {
  Pressable,
  View,
  TextInput,
  TextInputProps,
  Text,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

import { useTheme } from "@/design-system/theme/useTheme";

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

/**
 * A labelled text field.
 *
 * The label used to be a sibling `Text` with no association to the input at
 * all. Visually that reads fine, because sighted users infer the relationship
 * from proximity; a screen reader has no proximity. It announced every field
 * on the sign-in screen as an unlabelled edit box, so the only way to tell the
 * email field from the password field was to count them. The same omission is
 * why the tests for that screen had to address fields by placeholder text --
 * `getByLabelText` had nothing to match, which was the accessibility tree
 * reporting the same defect the screen reader was.
 *
 * The association is made two ways because neither is portable alone:
 * `accessibilityLabel` is what VoiceOver and TalkBack actually read, while
 * `nativeID`/`accessibilityLabelledBy` is the real Android association and
 * keeps the announced text from drifting away from the text on screen.
 *
 * The ref is forwarded. It previously was not, so a `ref` passed by a caller
 * was accepted by the type checker and then quietly dropped -- which is what
 * kept the sign-in screen from moving the cursor to the password field.
 */
export const FormInput = forwardRef<TextInput, FormInputProps>(function FormInput(
  { label, error, icon, secureTextEntry, ...props },
  ref,
) {
  const { theme } = useTheme();

  // Stable per instance, so two fields on one screen cannot claim the same
  // label element.
  const id = useId();

  const labelID = `${id}-label`;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View className="mb-4 space-y-2">
      {label && (
        <Text
          nativeID={labelID}
          className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary"
        >
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center rounded-3xl px-4 h-14 bg-surface dark:bg-dark-surface border-2 ${
          error
            ? "border-danger dark:border-dark-danger"
            : "border-border dark:border-dark-border"
        }`}
      >
        {icon && (
          // Decorative: the icon repeats the label, so announcing it would
          // make the reader hear "Email Address" twice before the field.
          <View
            className="mr-3"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {icon}
          </View>
        )}

        <TextInput
          ref={ref}
          className="flex-1 text-base font-medium text-text dark:text-dark-text"
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={label}
          accessibilityLabelledBy={label ? labelID : undefined}
          // The red border states the error to everyone who can see it. This
          // is the same statement for anyone who cannot.
          accessibilityHint={error}
          {...props}
          secureTextEntry={isPassword && !passwordVisible}
        />

        {isPassword ? (
          <Pressable
            className="ml-3 p-1"
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
            accessibilityHint="Toggles password visibility"
          >
            {passwordVisible ? (
              <EyeOff size={20} color={theme.colors.textMuted} />
            ) : (
              <Eye size={20} color={theme.colors.textMuted} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error && (
        <Text
          // Announced when it appears, rather than only if the user happens to
          // navigate back over the field after a failed submit.
          accessibilityLiveRegion="polite"
          className="text-sm font-medium text-danger dark:text-dark-danger"
        >
          {error}
        </Text>
      )}
    </View>
  );
});

