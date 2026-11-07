import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { View } from "react-native";

import {
  useColorScheme,
  vars,
} from "nativewind";

import {
  cssVariablesForTheme,
  themes,
} from "./palette";

import {
  ThemeContext,
} from "./ThemeContext";

import {
  getStoredTheme,
  getStoredThemeName,
  setStoredTheme,
  setStoredThemeName,
} from "./storage";

import {
  ThemeMode,
  ThemeName,
} from "./types";

export function ThemeProvider({
  children,
}: PropsWithChildren) {
  const {
    colorScheme,
    setColorScheme,
  } = useColorScheme();

  const [mode, setModeState] =
    useState<ThemeMode>(
      getStoredTheme(),
    );

  const [name, setNameState] =
    useState<ThemeName>(
      getStoredThemeName(),
    );

  useEffect(() => {
    setStoredTheme(mode);

    if (mode === "system") {
      setColorScheme("system");
      return;
    }

    setColorScheme(mode);
  }, [mode, setColorScheme]);

  // There was a second effect here that listened to Appearance and pushed the
  // resolved scheme back into NativeWind. It undid the line above: passing a
  // concrete value takes NativeWind *out* of system mode, so it stopped
  // following the device on its own and relied on this listener to keep it in
  // step -- the same job, done twice, with the duplicate able to disagree.
  // NativeWind already tracks the device when told "system".

  /**
   * Persisting before setting state, rather than in an effect afterwards.
   *
   * The mode above is written by an effect, which is fine because it also has
   * to talk to NativeWind. This has nothing to synchronise, and an effect
   * would only add a frame in which the state and the device disagree.
   */
  const setName = useCallback(
    (next: ThemeName) => {
      setStoredThemeName(next);
      setNameState(next);
    },
    [],
  );

  const resolvedScheme =
    mode === "system"
      ? colorScheme ?? "light"
      : mode;

  const isDark =
    resolvedScheme === "dark";

  const theme = useMemo(
    () => ({
      mode,
      name,
      isDark,
      colors:
        isDark
          ? themes[name].dark
          : themes[name].light,
    }),
    [
      mode,
      name,
      isDark,
    ],
  );

  /**
   * The selected palette, as CSS custom properties.
   *
   * This is the entire mechanism by which a theme reaches the application.
   * Class names compile to `rgb(var(--color-surface) / <alpha-value>)` rather
   * than to a hex value, so assigning the variables here recolours every
   * screen styled with a class name -- around 99 files -- none of which needs
   * to know that themes exist.
   *
   * Both schemes are published, not just the active one. NativeWind chooses
   * between `bg-surface` and `dark:bg-dark-surface` itself, from the colour
   * scheme, and needs both sides present to do it. Publishing only the active
   * scheme would leave every `dark:` class in the app -- 856 of them --
   * resolving to nothing.
   */
  const themeVars = useMemo(
    () => vars(cssVariablesForTheme(name)),
    [name],
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        setMode: setModeState,
        name,
        setName,
      }}
    >
      {/*
        A plain host View, because custom properties inherit down the native
        view tree and something has to carry them. `flex-1` is not decoration:
        a wrapper with no dimensions lays out at zero height and takes the
        whole application with it.
      */}
      <View style={themeVars} className="flex-1">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}
