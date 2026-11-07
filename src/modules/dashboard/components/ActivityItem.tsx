import { View, Text, Pressable } from "react-native";

import { useRouter } from "expo-router";

interface Props {
  title: string;

  /**
   * Which workspace the event belongs to. Shown beside the time rather than
   * inside the title, because a reader scanning the feed is deciding which
   * engagement a row concerns before they read what happened in it.
   */
  subtitle?: string;

  time: string;

  /**
   * Where this entry came from. Null when the event has no screen of its own,
   * in which case the row stays plain text rather than pretending to be
   * tappable -- a row that presses and then stays put reads as a broken app.
   */
  href?: string | null;
}

export function ActivityItem({
  title,
  subtitle,
  time,
  href,
}: Props) {
  const router = useRouter();

  const body = (
    <View
      className="
      flex-row
      items-start
      py-4
      border-b
      border-border
      dark:border-dark-border
      "
    >
      <View
        className="
        w-2.5
        h-2.5
        rounded-full
        bg-primary
        dark:bg-dark-primary
        mt-2
        mr-4
        "
      />

      <View className="flex-1">
        <Text className="text-text dark:text-dark-text font-medium">
          {title}
        </Text>

        <View className="flex-row items-center mt-1">
          {!!subtitle && (
            <>
              <Text
                className="text-text dark:text-dark-text text-sm font-medium"
                numberOfLines={1}
              >
                {subtitle}
              </Text>

              <Text className="text-text-secondary dark:text-dark-text-secondary text-sm mx-1.5">
                ·
              </Text>
            </>
          )}

          <Text className="text-text-secondary dark:text-dark-text-secondary text-sm">
            {time}
          </Text>
        </View>
      </View>

      {!!href && (
        // A quiet affordance. Without it, the only way to discover that some
        // rows open and others do not is to try them.
        <Text className="text-text-secondary dark:text-dark-text-secondary mt-2 ml-3">
          ›
        </Text>
      )}
    </View>
  );

  if (!href) {
    return body;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, time].filter(Boolean).join(", ")}
      onPress={() => router.push(href)}
    >
      {body}
    </Pressable>
  );
}