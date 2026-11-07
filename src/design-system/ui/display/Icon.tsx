import type { ComponentType } from "react";

import type { LucideProps } from "lucide-react-native";

import { useIconColor, type IconTone } from "../../theme/useColor";

/**
 * A named size scale for icons.
 *
 * Sizes were previously written as raw numbers at each call site, and the same
 * icon in the same position appeared at 16, 18 and 20 across three screens.
 * The values below are tied to the roles icons actually play: `sm` sits inside
 * a caption, `md` beside body text, `lg` leads a list row, `xl` heads an empty
 * state.
 */
export const iconSizes = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
  display: 40,
} as const;

export type IconSize = keyof typeof iconSizes;

export interface IconProps extends Omit<LucideProps, "color" | "size"> {
  /** The lucide icon to render, passed as a component rather than an element. */
  as: ComponentType<LucideProps>;

  tone?: IconTone;

  size?: IconSize | number;
}

/**
 * Every icon in the application.
 *
 * Lucide takes its colour as a prop, which cannot carry a `dark:` variant, so
 * screens resorted to literal hex -- and a hex value is fixed while the theme
 * is not. An icon set to `#2563eb` stays that blue on a near-black background,
 * where it glares, and it ignores any retuning of `primary`.
 *
 * Routing every icon through here means the colour is a token, resolved
 * against the active theme at render time, and the size comes from a scale
 * instead of a number someone picked.
 */
export function Icon({ as: Glyph, tone = "default", size = "md", ...props }: IconProps) {
  const color = useIconColor(tone);

  return (
    <Glyph
      color={color}
      size={typeof size === "number" ? size : iconSizes[size]}
      strokeWidth={props.strokeWidth ?? 2}
      {...props}
    />
  );
}
