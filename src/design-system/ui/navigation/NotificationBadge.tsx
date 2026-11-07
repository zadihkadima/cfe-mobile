import { View } from "react-native";

import { Text } from "../typography";

interface Props {
  count?: number;
}

export function NotificationBadge({
  count = 0,
}: Props) {
  if (count <= 0) {
    return null;
  }

  return (
    <View
      className="
      absolute
      -top-1
      -right-1
      min-w-[18px]
      h-[18px]
      rounded-full
      items-center
      justify-center
      px-1
      bg-danger
      dark:bg-dark-danger
      "
    >
      <Text
        variant="caption"
        tone="inverted"
        weight="600"
      >
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}