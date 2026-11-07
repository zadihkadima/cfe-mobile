import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Eye, EyeOff } from "lucide-react-native";

import { Icon } from "./Icon";

/**
 * How long a revealed value stays visible.
 *
 * Revealing is deliberate; leaving it revealed is not. Without this, the value
 * stays on screen through a switch to another app, a screenshot, or the phone
 * being handed over -- and the person who tapped the eye has usually stopped
 * looking within a few seconds.
 */
const AUTO_HIDE_MS = 15_000;

function mask(value: string) {
  // The last four are kept because that is what people are asked to confirm
  // over the phone, and a fully starred value would make the field useless for
  // its most common purpose.
  return `•••-••-${value.slice(-4)}`;
}

type Props = {
  value?: string;

  /** Shown when there is nothing stored. */
  placeholder?: string;
};

/**
 * A masked identifier with a reveal control.
 *
 * Previously two screens each defined their own maskSSN and rendered the
 * result as plain text, so the number could be masked but never read. Anyone
 * who needed the full value had to ask the client for it again, which is both
 * slower and less private than showing it to the person already authorised to
 * see it.
 */
export function MaskedValue({ value, placeholder = "—" }: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!revealed) return;

    const timer = setTimeout(() => setRevealed(false), AUTO_HIDE_MS);

    return () => clearTimeout(timer);
  }, [revealed]);

  // Re-hidden if the value itself changes, so navigating from one client to
  // another does not carry a reveal across to a different person's number.
  useEffect(() => {
    setRevealed(false);
  }, [value]);

  if (!value) {
    return (
      <Text className="font-semibold text-text dark:text-dark-text">
        {placeholder}
      </Text>
    );
  }

  return (
    <View className="flex-row items-center">
      <Text className="font-semibold text-text dark:text-dark-text">
        {revealed ? value : mask(value)}
      </Text>

      {/*
        A plain Pressable rather than the animated one used elsewhere. The
        scale animation is meant for rows and cards; on a 16px icon it moves
        two pixels and reads as a flicker, and it drags reanimated into every
        screen that shows an identifier for no visible benefit.
      */}
      <Pressable
        onPress={() => setRevealed((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={revealed ? "Hide the number" : "Show the number"}
        // Padded well beyond the icon: it sits at the end of a dense row, and
        // a near-miss on a 16px target is a tap on nothing.
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="ml-2 p-1"
      >
        {revealed ? (
          <Icon as={EyeOff} size="md" tone="muted" />
        ) : (
          <Icon as={Eye} size="md" tone="muted" />
        )}
      </Pressable>
    </View>
  );
}
