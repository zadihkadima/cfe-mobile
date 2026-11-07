import { ReactNode } from "react";
import { View } from "react-native";

import { ChevronRight } from "lucide-react-native";
import clsx from "clsx";

import { Text } from "../typography/Text";
import { PressableScale } from "../motion/PressableScale";
import { useTheme } from "../../theme/useTheme";

interface Props {

  /** An avatar, icon or status dot. Kept to roughly 40×40. */
  leading?: ReactNode;

  title: string;

  /** One supporting line. Truncated rather than wrapped, so rows stay even. */
  subtitle?: string;

  /** A timestamp, count or badge, aligned to the trailing edge. */
  trailing?: ReactNode;

  /**
   * Draws a chevron to signal that the row opens something. Defaults to true
   * when `onPress` is given, because a row that navigates without saying so is
   * a target the user has to discover by guessing.
   */
  showChevron?: boolean;

  onPress?(): void;

  /** Renders the row bolder, for the unread or requires-attention case. */
  emphasis?: boolean;

  className?: string;

}

/**
 * One row of a list.
 *
 * This shape — optional leading element, title, one supporting line, trailing
 * meta, chevron — was written out by hand on nearly every list screen in the
 * app, each time with slightly different padding, truncation and press
 * feedback. The consequence is not only the duplication: rows that should be
 * identical drift apart, and a user moving between two lists perceives the
 * inconsistency long before they could name it.
 *
 * A non-obvious detail worth keeping: the title and subtitle are pinned to a
 * single line. Letting them wrap makes row height depend on content, so a list
 * of otherwise similar items develops a ragged rhythm, and any virtualised list
 * loses the constant row height it needs to estimate scroll position.
 */
export function ListItem({

  leading,

  title,

  subtitle,

  trailing,

  showChevron,

  onPress,

  emphasis = false,

  className,

}: Props) {

  const { theme } = useTheme();

  const chevron =
    showChevron ?? Boolean(onPress);

  const content = (

    <View

      className={clsx(

        "flex-row",
        "items-center",

        "gap-3",

        "px-4",
        "py-3",

        // A fixed floor keeps rows even when some have a subtitle and some do
        // not, and it clears the 44pt minimum touch target on its own.
        "min-h-[64px]",

        className,

      )}

    >

      {leading}

      <View className="flex-1 gap-0.5">

        <Text

          numberOfLines={1}

          className={clsx(

            emphasis && "font-semibold",

          )}

        >

          {title}

        </Text>

        {subtitle ? (

          <Text

            variant="caption"

            numberOfLines={1}

            className="text-text-secondary dark:text-dark-text-secondary"

          >

            {subtitle}

          </Text>

        ) : null}

      </View>

      {trailing}

      {chevron ? (

        <ChevronRight

          size={18}

          // Muted rather than full-strength: the chevron is an affordance, not
          // information, and at full contrast it competes with the title on
          // every single row.
          color={theme.colors.textMuted}

        />

      ) : null}

    </View>

  );

  if (!onPress) {

    return content;

  }

  return (

    <PressableScale

      onPress={onPress}

      // Rows are wide, so the default compression would travel a long way
      // horizontally and read as the row shrinking rather than being pressed.
      scaleTo={0.985}

      accessibilityRole="button"

      accessibilityLabel={

        subtitle ? `${title}. ${subtitle}` : title

      }

    >

      {content}

    </PressableScale>

  );

}
