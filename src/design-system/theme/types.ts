import type { Palette, ThemeName } from "./palette";

export type { ThemeName };

export type ThemeMode =
  | "light"
  | "dark"
  | "system";

/**
 * The theme handed to components that style in JavaScript rather than through
 * class names.
 *
 * `colors` is the `Palette` type directly rather than a hand-listed interface.
 * It used to be the latter, which made this the third place the token list was
 * written out, and it had already fallen behind: the provider assigns the whole
 * palette, but the declared type named only twenty of its tokens, so `divider`
 * and every brand variant were present at runtime and invisible to TypeScript.
 * A component reaching for one got a type error and reasonably concluded the
 * token did not exist — which is how a hardcoded hex value ends up in a
 * codebase that already has a design system.
 */
export interface Theme {
  /** Light, dark, or following the device. */
  mode: ThemeMode;

  /**
   * Which palette is in use.
   *
   * Kept separate from `mode` because the two answer different questions.
   * `mode` decides whether the app shows its light or its dark scheme; `name`
   * decides whose light and dark schemes those are. Collapsing them into one
   * setting would mean picking a theme also picked light or dark, and someone
   * who wants Cobalt at night could not have it.
   */
  name: ThemeName;

  isDark: boolean;

  colors: Palette;
}

