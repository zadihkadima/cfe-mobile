import {
  PropsWithChildren,
} from "react";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  StatusBar,
} from "expo-status-bar";

import clsx from "clsx";

import { useTheme } from "@/design-system/theme/useTheme";

interface Props
  extends PropsWithChildren {

  className?: string;

}

export function Screen({

  children,

  className,

}: Props) {
  const { theme } = useTheme();
  const isDark = theme.isDark;

  return (

    <SafeAreaView
      edges={[
        "top",
        "left",
        "right",
      ]}
      className={clsx(
        "flex-1 bg-background dark:bg-dark-background",
        className,
      )}
    >

      <StatusBar
        style={isDark ? "light" : "dark"}
      />

      {children}

    </SafeAreaView>

  );
}