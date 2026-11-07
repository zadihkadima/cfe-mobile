import { PropsWithChildren } from "react";

import { ScrollView } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAvoidingContainer } from "@/design-system/ui/layout/KeyboardAvoidingContainer";

/**
 * The frame every signed-out form sits in.
 *
 * These screens each solved the keyboard independently, and three of the five
 * did not solve it at all, which is why the handling now lives in one place.
 *
 * `keyboardShouldPersistTaps` matters more than it looks. Without it the first
 * tap on the submit button while the keyboard is open is spent dismissing the
 * keyboard and never reaches the button, so signing in appears to need two
 * presses -- and the second lands on a button that has since moved.
 *
 * The padding comes from the insets rather than a fixed class because these
 * screens have no header above them to hold content clear of the notch.
 */
export function AuthFormLayout({
  children,
  className = "bg-slate-50 dark:bg-slate-950",
}: PropsWithChildren<{ className?: string }>) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingContainer className={`flex-1 ${className}`}>
      <ScrollView
        testID="auth-form-scroll"
        className="px-5"
        contentContainerStyle={{
          // Grows to fill a tall screen so the form can be centred, and is
          // free to overflow into a scroll on a short one. Centring with a
          // fixed height instead is what leaves a form unreachable once the
          // keyboard covers the lower half.
          flexGrow: 1,
          justifyContent: "center",
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
}
