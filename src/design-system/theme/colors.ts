/**
 * Semantic colours for React components.
 *
 * This module used to hold its own copy of every hex value, duplicating the
 * map inside `tailwind.config.js`. The two had already drifted: `elevated`
 * disagreed in both themes and nothing detected it, because a screen styled
 * with `bg-elevated` and one styled with `theme.elevated` each looked
 * plausible alone. Both now read from `palette.js`, so a colour is defined
 * once and a change reaches the class-name and JavaScript styling paths
 * together.
 */

import {
  dark,
  light,
  themes,
  THEME_NAMES,
  DEFAULT_THEME,
  ACCENTS,
  ACCENT_NAMES,
  accentFor,
  type AccentName,
  type AccentPair,
  type ColorToken,
  type Palette,
  type ThemeDefinition,
  type ThemeName,
} from "./palette";

export type {
  AccentName,
  AccentPair,
  ColorToken,
  Palette,
  ThemeDefinition,
  ThemeName,
};

export const colors = { light, dark } as const;

/**
 * The available themes, re-exported here rather than imported from
 * `palette.js` directly.
 *
 * `palette.js` is CommonJS with a sibling `.d.ts`, and that pairing only
 * resolves cleanly through a relative import. Reaching it as
 * `@/design-system/theme/palette` gets the JavaScript without the
 * declarations, so every token comes back as `any` -- which defeats the point
 * of having written the declarations. Everything therefore enters the app
 * through this module, which is already the established path.
 */
export { themes, THEME_NAMES, DEFAULT_THEME };

/**
 * The categorical accents, which are not theme tokens.
 *
 * They do not change with the theme, and are not CSS variables, because their
 * whole purpose is that a given person or entity keeps one colour. See the
 * note above `ACCENTS` in `palette.js`.
 */
export { ACCENTS, ACCENT_NAMES, accentFor };

