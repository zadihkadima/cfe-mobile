import {
  createContext,
} from "react";

import { DEFAULT_THEME, light } from "./palette";

import {
  Theme,
  ThemeMode,
  ThemeName,
} from "./types";

export interface ThemeContextValue {

  theme: Theme;

  mode: ThemeMode;

  setMode(
    mode: ThemeMode,
  ): void;

  /** The selected palette. */
  name: ThemeName;

  setName(
    name: ThemeName,
  ): void;

}

/**
 * The theme used when no provider sits above a component.
 *
 * This context previously defaulted to `null!`, so any component reading it
 * outside the provider failed with "cannot read property 'theme' of null" — an
 * error naming neither the component nor the missing provider, surfacing as a
 * blank screen. Falling back to the light palette is not a correct rendering,
 * but it is a legible one: the component appears and looks wrong, which is far
 * easier to trace than a crash with nothing to go on.
 *
 * `setMode` and `setName` are deliberate no-ops rather than throws. A theme
 * control that quietly does nothing outside a provider is a smaller failure
 * than one that takes down the screen it lives on.
 */
const fallback: ThemeContextValue = {

  theme: {
    mode: "light",
    name: DEFAULT_THEME,
    isDark: false,
    colors: light,
  },

  mode: "light",

  setMode: () => {},

  name: DEFAULT_THEME,

  setName: () => {},

};

export const ThemeContext =
  createContext<ThemeContextValue>(
    fallback,
  );
