import { View } from "react-native";

import { ActivityItem } from "./ActivityItem";

type Activity = {
  id: string;
  title: string;

  /** Which workspace it happened in, absent when not workspace-scoped. */
  subtitle?: string;

  time: string;
  href?: string | null;
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <View
      className="
      bg-surface
      dark:bg-dark-surface
      rounded-2xl
      border
      border-border
      dark:border-dark-border
      px-5
      "
    >
      {activities.map((item) => (
        <ActivityItem
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          time={item.time}
          href={item.href}
        />
      ))}
    </View>
  );
}