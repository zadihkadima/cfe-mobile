import { forwardRef } from "react";
import {
  Text as RNText,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";

import clsx from "clsx";

import { textTones, typography, type TextTone, type TypographyRole } from "../../theme/typography";

export type TextVariant = TypographyRole;

export interface TextProps extends RNTextProps {
  /** The role this text plays in the hierarchy. */
  variant?: TextVariant;

  /** Semantic colour. One choice covers both themes. */
  tone?: TextTone;

  align?: TextStyle["textAlign"];

  /**
   * Overrides the weight the variant carries. Reach for a different variant
   * before reaching for this; it exists for genuine exceptions, such as a
   * numeral that must sit heavier than the label beside it.
   */
  weight?: TextStyle["fontWeight"];

  style?: StyleProp<TextStyle>;

  className?: string;
}

/**
 * Every piece of text in the application.
 *
 * The variant carries size, weight, leading and tracking together, taken from
 * the scale in `theme/typography`. The previous implementation expressed
 * variants as Tailwind size and weight classes only, leaving line height to
 * the platform default -- and the platform default for 17pt is tighter than
 * body copy wants, which is why paragraphs read as cramped no matter how much
 * padding surrounded them.
 *
 * Colour stays in class names rather than resolved hex values, so the
 * component never has to read the theme and both themes are covered by a
 * single `tone` at the call site.
 *
 * This file also replaces seven near-identical wrappers -- `H1`, `H2`, `H3`,
 * `Body`, `Caption`, `Label` and `BaseText` -- which duplicated the scale in
 * their own class strings, disagreed with the `Text` variants they shadowed,
 * and were imported by nothing.
 */
export const Text = forwardRef<RNText, TextProps>(function Text(
  { variant = "body", tone = "default", align, weight, className, style, children, ...props },
  ref,
) {
  return (
    <RNText
      ref={ref}
      className={clsx(textTones[tone], className)}
      style={[
        typography[variant],
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
});
