import { useTheme } from "./useTheme";

export function useThemedStyles() {

  const { theme } = useTheme();

  return theme.colors;

}