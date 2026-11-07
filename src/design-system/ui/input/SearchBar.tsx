import { useRef } from "react";
import {
  Pressable,
  TextInput,
  View,
} from "react-native";

import { Search, X } from "lucide-react-native";
import clsx from "clsx";

import { useTheme } from "../../theme/useTheme";

interface Props {

  value: string;

  onChangeText(value: string): void;

  placeholder?: string;

  /**
   * Announced to screen readers, which otherwise hear only the placeholder —
   * and a placeholder disappears the moment typing starts, leaving the field
   * unlabelled exactly when it is in use.
   */
  accessibilityLabel?: string;

  className?: string;

}

/**
 * A search field.
 *
 * Two details here are the difference between a search box and a usable one.
 *
 * The clear button: without it, emptying a search means holding backspace,
 * which on a phone is slow enough that users abandon the search and navigate
 * away instead. It appears only when there is something to clear, so it does
 * not sit there as a permanently dead control.
 *
 * `autoCorrect` and `autoCapitalize` are off. Both are on by default and both
 * are actively wrong here: the keyboard capitalises the first letter of a
 * client's surname mid-query and autocorrects surnames and reference numbers
 * into ordinary words, so the search silently looks for something the user did
 * not type. On a platform where people search for names and tax identifiers,
 * that is a correctness problem rather than an annoyance.
 *
 * Debouncing is deliberately not done here. It belongs with the query, not the
 * input: a field that lags behind the keyboard feels broken, and the caller is
 * the only party that knows whether its search hits the network or filters an
 * array already in memory.
 */
export function SearchBar({

  value,

  onChangeText,

  placeholder = "Search",

  accessibilityLabel,

  className,

}: Props) {

  const { theme } = useTheme();

  const inputRef = useRef<TextInput>(null);

  return (

    <View

      className={clsx(

        "flex-row",
        "items-center",

        "gap-2",

        "rounded-xl",

        "px-3",

        "h-12",

        "bg-surface",
        "dark:bg-dark-surface",

        "border",
        "border-border",
        "dark:border-dark-border",

        className,

      )}

    >

      <Search

        size={18}

        color={theme.colors.textMuted}

      />

      <TextInput

        ref={inputRef}

        value={value}

        onChangeText={onChangeText}

        placeholder={placeholder}

        placeholderTextColor={theme.colors.textMuted}

        accessibilityLabel={accessibilityLabel ?? placeholder}

        // See the note above: both default to on, and both corrupt queries for
        // names and reference numbers.
        autoCorrect={false}

        autoCapitalize="none"

        // Renders the keyboard's return key as "search" and, on iOS, offers the
        // clear affordance users already expect in a field of this shape.
        returnKeyType="search"

        clearButtonMode="never"

        className="flex-1 text-base text-text dark:text-dark-text"

      />

      {value.length > 0 ? (

        <Pressable

          onPress={() => {

            onChangeText("");

            // Keeping focus matters: clearing is usually the start of a new
            // query, and dismissing the keyboard would force the user to tap
            // back into the field to continue.
            inputRef.current?.focus();

          }}

          accessibilityRole="button"

          accessibilityLabel="Clear search"

          // Enlarges the touch target without enlarging the icon. The glyph
          // suits a 16pt drawing and a 16pt target does not suit a fingertip.
          hitSlop={10}

        >

          <X

            size={18}

            color={theme.colors.textMuted}

          />

        </Pressable>

      ) : null}

    </View>

  );

}
