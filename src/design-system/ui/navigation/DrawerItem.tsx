import { usePathname, useRouter } from "expo-router";
import {
  Pressable,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/design-system/theme/useTheme";

/**
 * One row of the navigation drawer.
 *
 * Typed rather than `any`. The badge in particular is a count, and the
 * difference between "absent" and "zero" is what decides whether anything is
 * drawn at all -- an untyped item hid that distinction from every reader of
 * this file.
 */
export interface DrawerMenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  badge?: number;
}

interface Props {
  item: DrawerMenuItem;
  onPress(): void;
}

export function DrawerItem({
  item,
  onPress,
}: Props) {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const active =
    pathname === item.href;

  const Icon = item.icon;
  const iconColor = active
    ? theme.colors.primaryLight
    : theme.colors.textMuted;

  const handlePress = () => {
    onPress();

    if (pathname === item.href) {
      return;
    }

    router.navigate(item.href);
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`
flex-row
items-center
justify-between
rounded-2xl
px-4
py-4
mb-2

${active ? "bg-primary/10 dark:bg-dark-primary/10" : ""}
`}
    >
      <View className="flex-row items-center">

        <Icon
          size={22}
          color={iconColor}
        />

        <Text
          className={`
ml-4
text-base

${active
            ? "text-primary dark:text-dark-primary font-semibold"
            : "text-text dark:text-dark-text"}
`}
        >
          {item.title}
        </Text>

      </View>

      {/*
          Compared against zero rather than tested for truthiness.

          `item.badge && ...` evaluates to the number 0 when the count is zero,
          and React Native renders that as a bare text node, which throws
          "Text strings must be rendered within a <Text> component" and takes
          the whole drawer down with it. Unread counts sit at zero most of the
          time, so this was the common case rather than an edge one.
        */}
      {item.badge !== undefined && item.badge > 0 ? (
        <View
          className="
bg-primary
dark:bg-dark-primary
rounded-full
px-2
py-1
"
        >
          <Text className="text-white text-xs font-bold">
            {/*
                Capped, because the badge is a fixed-width pill and a four
                digit count spills over the row it sits on.
              */}
            {item.badge > 99 ? "99+" : item.badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
