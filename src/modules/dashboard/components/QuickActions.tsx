import { router } from "expo-router";
import { View } from "react-native";

import { ActionChip } from "./ActionChip";

type QuickAction = {
  title: string;
  href: string;
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View
      className="
      flex-row
      flex-wrap
      gap-3
      "
    >
      {actions.map((action) => (
        <ActionChip
          key={action.href}
          title={action.title}
          onPress={() => router.push(action.href)}
        />
      ))}
    </View>
  );
}