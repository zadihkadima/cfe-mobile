import { PropsWithChildren } from "react";
import { RefreshControl, ScrollView } from "react-native";

import { KeyboardAvoidingContainer } from "./KeyboardAvoidingContainer";

type Props = PropsWithChildren<{
  refreshing?: boolean;
  onRefresh?(): void;
}>;

/**
 * The scroll container for a screen whose content is a form or a fixed set of
 * sections rather than a list.
 *
 * Screens own their scrolling; route layouts do not. A layout wraps whatever
 * route is mounted and cannot know whether that route scrolls itself, and when
 * it guessed wrong the cost was not cosmetic: a FlatList inside a ScrollView
 * loses virtualisation entirely, mounting every row at once, and React Native
 * warns about exactly this. Screens that scroll now say so here, and the shell
 * stays out of it.
 *
 * The padding matches what the shell used to apply, so moving a screen onto
 * this component does not move its content.
 */
export function ScreenScrollView({ children, refreshing = false, onRefresh }: Props) {
  return (
    <KeyboardAvoidingContainer className="flex-1">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        automaticallyAdjustKeyboardInsets
        // Otherwise the first tap on a control only dismisses the keyboard and
        // the user has to tap the same thing twice.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
        }
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
}
