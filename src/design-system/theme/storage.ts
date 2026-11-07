import { storage } from "@/core/storage/mmkv";

import { DEFAULT_THEME, themes } from "./palette";

import { ThemeMode, ThemeName } from "./types";

const KEY = "theme";
const NAME_KEY = "theme.name";

export function getStoredTheme(): ThemeMode {

  return (
    storage.getString(KEY) as ThemeMode | undefined
  ) ?? "dark";

}

export function setStoredTheme(
  mode: ThemeMode,
) {

  storage.setString(
    KEY,
    mode,
  );

}

/**
 * The palette chosen on this device, or the default.
 *
 * The stored value is checked against the themes that exist rather than cast
 * to a `ThemeName`. It comes off the device, where it may have been written by
 * a build that offered a theme this one does not -- after a downgrade, or a
 * theme being withdrawn. An unrecognised name would index to `undefined`, the
 * provider would read colours off that, and every screen would render with no
 * colour at all. Falling back turns a blank application into an unremarkable
 * one.
 */
export function getStoredThemeName(): ThemeName {

  const stored = storage.getString(NAME_KEY);

  if (stored && stored in themes) {
    return stored as ThemeName;
  }

  return DEFAULT_THEME;

}

export function setStoredThemeName(
  name: ThemeName,
) {

  storage.setString(
    NAME_KEY,
    name,
  );

}
