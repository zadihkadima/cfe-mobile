import { Text, View } from "react-native";

import { Check, Monitor, Moon, Sun } from "lucide-react-native";

import {
  THEME_NAMES,
  themes,
  type ThemeName,
} from "@/design-system/theme/colors";
import { useTheme } from "@/design-system/theme/useTheme";
import type { ThemeMode } from "@/design-system/theme/types";
import { Icon } from "@/design-system/ui";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";
import { PressableScale } from "@/design-system/ui/motion/PressableScale";

const MODES: {
  value: ThemeMode;
  label: string;
  Icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "Automatic", Icon: Monitor },
];

/**
 * A theme's identity in five colours.
 *
 * The swatches are read from the theme being offered, not from the one in use,
 * so the row shows what choosing it would look like. A preview drawn in the
 * active palette would make every option identical, which is the one thing a
 * picker must not do.
 *
 * The scheme *is* taken from the active theme, because the question here is
 * which palette to use, not whether to be light or dark -- that is the control
 * above. Showing Cobalt's light swatches to someone sitting in dark mode would
 * be answering a question they did not ask.
 */
function Swatches({
  name,
  isDark,
}: {
  name: ThemeName;
  isDark: boolean;
}) {
  const palette = isDark ? themes[name].dark : themes[name].light;

  const shown = [
    palette.primary,
    palette.secondary,
    palette.accent,
    palette.surfaceVariant,
    palette.launchBackground,
  ];

  return (
    <View className="flex-row">
      {shown.map((colour, index) => (
        <View
          key={`${name}-${index}`}
          // A border on every swatch, not just the pale ones. Seafoam's
          // surface is white and Seafoam's launch colour is black; without an
          // outline the first disappears into a light card and the second into
          // a dark one, and the row silently shows four colours instead of
          // five.
          className="mr-1.5 h-6 w-6 rounded-full border border-border dark:border-dark-border"
          style={{ backgroundColor: colour }}
        />
      ))}
    </View>
  );
}

/**
 * Appearance: the colour scheme, and which palette it draws from.
 *
 * Two settings rather than one. `mode` decides light or dark; `theme` decides
 * whose light and dark those are. Folding them together would have made
 * "Cobalt" and "Cobalt at night" separate options, which is eight entries to
 * express what two controls express in seven.
 */
export function AppearanceScreen() {
  const { theme, mode, setMode, name, setName } = useTheme();

  return (
    <SharedLayout title="Appearance">
      <View className="px-4 pt-2">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted dark:text-dark-text-muted">
          Colour scheme
        </Text>

        <View className="mb-6 flex-row rounded-2xl border border-border bg-surface p-1 dark:border-dark-border dark:bg-dark-surface">
          {MODES.map((entry) => {
            const selected = mode === entry.value;

            return (
              <PressableScale
                key={entry.value}
                onPress={() => setMode(entry.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={entry.label}
                className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
                  selected ? "bg-primary" : ""
                }`}
              >
                <Icon
                  as={entry.Icon}
                  size="sm"
                  tone={selected ? "inverted" : "muted"}
                />

                <Text
                  className={`ml-2 text-sm font-medium ${
                    selected
                      ? "text-text-inverted"
                      : "text-text-secondary dark:text-dark-text-secondary"
                  }`}
                >
                  {entry.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted dark:text-dark-text-muted">
          Theme
        </Text>

        {THEME_NAMES.map((option) => {
          const selected = name === option;
          const definition = themes[option];

          return (
            <PressableScale
              key={option}
              onPress={() => setName(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={definition.label}
              className={`mb-3 flex-row items-center rounded-2xl border p-4 ${
                selected
                  ? "border-primary bg-primary-subtle dark:border-dark-primary dark:bg-dark-primary-subtle"
                  : "border-border bg-surface dark:border-dark-border dark:bg-dark-surface"
              }`}
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-text dark:text-dark-text">
                  {definition.label}
                </Text>

                <Text className="mb-3 mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
                  {definition.description}
                </Text>

                <Swatches name={option} isDark={theme.isDark} />
              </View>

              {selected ? (
                <Icon as={Check} size="md" tone="primary" />
              ) : null}
            </PressableScale>
          );
        })}

        <Text className="mb-8 mt-2 text-xs leading-5 text-text-muted dark:text-dark-text-muted">
          The theme applies to this device only. Everyone signs in to the same
          data whichever one they choose.
        </Text>
      </View>
    </SharedLayout>
  );
}
