import { View } from "react-native";

import clsx from "clsx";

import { Text } from "../typography/Text";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

interface Props {

  label: string;

  /**
   * Chosen by meaning, not by colour. A caller asks for `danger` because the
   * state is bad, never for `red` — which is what keeps the palette able to
   * change without auditing every screen for what each colour meant.
   */
  tone?: BadgeTone;

  className?: string;

}

/**
 * Every tone pairs a subtle background with its full-strength foreground, so
 * contrast holds in both themes. Composing an opacity over an unknown backdrop
 * is the usual shortcut here and it produces muddy fills that fail contrast
 * checks in dark mode specifically.
 */
const tones: Record<BadgeTone, string> = {

  neutral:
    "bg-surface-variant dark:bg-dark-surface-variant",

  info:
    "bg-info-subtle dark:bg-dark-info-subtle",

  success:
    "bg-success-subtle dark:bg-dark-success-subtle",

  warning:
    "bg-warning-subtle dark:bg-dark-warning-subtle",

  danger:
    "bg-danger-subtle dark:bg-dark-danger-subtle",

};

const toneText: Record<BadgeTone, string> = {

  neutral:
    "text-text-secondary dark:text-dark-text-secondary",

  info:
    "text-info dark:text-dark-info",

  success:
    "text-success dark:text-dark-success",

  warning:
    "text-warning dark:text-dark-warning",

  danger:
    "text-danger dark:text-dark-danger",

};

/**
 * A small label for a state.
 *
 * Status was previously written as body text — "Status: Active", "Invited: No"
 * — which has two costs. It reads at the same weight as the row's actual
 * content, so a list of names becomes a wall of words with the names no longer
 * standing out; and stating a field name on every row repeats what the reader
 * already knows in order to say the one word that differs.
 *
 * A badge says "Active". The field name is implied by where it sits, and the
 * shape signals "this is a state" before any of it is read.
 */
export function Badge({

  label,

  tone = "neutral",

  className,

}: Props) {

  return (

    <View

      className={clsx(

        "self-start",

        "rounded-full",

        "px-2",
        "py-0.5",

        tones[tone],

        className,

      )}

    >

      <Text

        variant="caption"

        className={clsx(

          "font-medium",

          toneText[tone],

        )}

      >

        {label}

      </Text>

    </View>

  );

}
