import { useTheme } from "./useTheme";

import type { ColorToken } from "./palette";

/**
 * Resolves a semantic token to the hex value for the active theme.
 *
 * The design system's colours live in class names, which works for anything
 * React Native styles -- but not for everything. Vector icons, chart strokes,
 * `ActivityIndicator`, the status bar and the native refresh control all take
 * a colour as a prop, and a prop cannot carry a `dark:` variant.
 *
 * With no way to express those, screens fell back to literal hex: forty-odd
 * files pass values like `#2563eb` to a lucide icon. Each is invisible to the
 * palette, so retuning `primary` moves the text and leaves the icon beside it
 * behind, and in dark mode the icon keeps its light-theme value and either
 * glares or disappears. This hook closes the gap -- a prop that needs a colour
 * asks for a token, exactly as a class name does.
 */
export function useColor(token: ColorToken): string {
  const { theme } = useTheme();

  return theme.colors[token];
}

/**
 * The same, for a component needing several colours at once.
 *
 * Returning the whole palette avoids a row of `useColor` calls at the top of
 * a component, which is both noisy and easy to get out of order.
 */
export function useColors() {
  const { theme } = useTheme();

  return theme.colors;
}

/**
 * Icon colour by role rather than by token.
 *
 * An icon is nearly always one of a handful of things: the leading glyph on a
 * row, a chevron, a status mark, or the icon inside a filled button. Naming
 * those roles keeps call sites from choosing between `textMuted` and
 * `textSecondary` case by case, which is how two identical-looking rows end up
 * with chevrons of different weight.
 */
export type IconTone =
  | "default"
  | "secondary"
  | "muted"
  | "inverted"
  | "primary"
  | "secondaryBrand"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "danger";

const iconTokens: Record<IconTone, ColorToken> = {
  default: "text",
  secondary: "textSecondary",
  muted: "textMuted",
  inverted: "textInverted",
  primary: "primary",
  secondaryBrand: "secondary",
  accent: "accent",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export function useIconColor(tone: IconTone = "default"): string {
  const { theme } = useTheme();

  return theme.colors[iconTokens[tone]];
}

export { iconTokens };
