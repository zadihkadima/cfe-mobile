/**
 * Types for the plain-JavaScript palette.
 *
 * `palette.js` has to be CommonJS so `tailwind.config.js` can require it at
 * build time, but every consumer inside the app is TypeScript and should still
 * get autocompletion and a compile error for a token that does not exist.
 */

/** Every semantic colour role. Light and dark define exactly the same set. */
export type ColorToken =
  | "background"
  | "surface"
  | "surfaceVariant"
  | "elevated"
  | "primary"
  | "primaryLight"
  | "primaryDark"
  | "primarySubtle"
  | "secondary"
  | "secondaryLight"
  | "secondaryDark"
  | "secondarySubtle"
  | "accent"
  | "text"
  | "textSecondary"
  | "textMuted"
  | "textInverted"
  | "border"
  | "divider"
  | "info"
  | "infoSubtle"
  | "success"
  | "successSubtle"
  | "warning"
  | "warningSubtle"
  | "danger"
  | "dangerSubtle"
  | "overlay"
  | "scrim"
  | "skeleton"
  | "skeletonHighlight"
  | "launchBackground"
  | "launchForeground";

export type Palette = Record<ColorToken, string>;

/**
 * The name a theme is stored under.
 *
 * Written to the device and read back on the next launch, so renaming one
 * silently resets everybody who had chosen it.
 */
export type ThemeName =
  | "cfe"
  | "slate"
  | "seafoam"
  | "cobalt"
  | "azure"
  | "harbour"
  | "ember"
  | "claret"
  | "lagoon"
  | "woodland"
  | "blossom";

export interface ThemeDefinition {
  /** Shown in the appearance picker. */
  label: string;

  /** One line under the label, describing the theme rather than naming it. */
  description: string;

  light: Palette;
  dark: Palette;
}

/** The default theme's two schemes, exported under their original names. */
export declare const light: Palette;
export declare const dark: Palette;

export declare const themes: Record<ThemeName, ThemeDefinition>;
export declare const THEME_NAMES: ThemeName[];
export declare const DEFAULT_THEME: ThemeName;
export declare const TOKENS: ColorToken[];

/**
 * One of the eight categorical hues.
 *
 * These name a hue, not a meaning. If a colour needs to mean something --
 * success, danger, a warning -- use the status tokens, which are the same in
 * every theme for exactly that reason.
 */
export type AccentName =
  | "amber"
  | "ember"
  | "fern"
  | "cyan"
  | "teal"
  | "rose"
  | "sand"
  | "violet";

/**
 * A background and the text that belongs on it.
 *
 * The pair is tuned together; neither half is safe on its own.
 */
export interface AccentPair {
  subtle: string;
  strong: string;
}

export declare const ACCENTS: Record<
  AccentName,
  { light: AccentPair; dark: AccentPair }
>;
export declare const ACCENT_NAMES: AccentName[];

/** The same input always yields the same accent, on every platform and run. */
export declare function accentFor(key: string | null | undefined): AccentName;

export declare function kebab(name: string): string;
export declare function varName(
  token: string,
  scheme: "light" | "dark",
): string;
export declare function alphaOf(value: string): number;

export declare function tailwindColors(): Record<string, string>;

/** The `{ "--color-x": "1 2 3" }` map for one theme in one scheme. */
export declare function cssVariables(
  theme: ThemeName,
  scheme: "light" | "dark",
): Record<string, string>;

/** Both schemes at once, which is what a running application needs. */
export declare function cssVariablesForTheme(
  theme: ThemeName,
): Record<string, string>;
