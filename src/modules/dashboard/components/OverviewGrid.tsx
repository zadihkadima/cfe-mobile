import { View } from "react-native";

import { StatCard } from "@/design-system/ui/display/StatCard";

type StatItem = {
  label: string;
  value: number;
};

interface Props {
  cards: StatItem[];
}

export function OverviewGrid({
  cards,
}: Props) {
  const [first, second, third, fourth] = cards;

  return (
    <View className="gap-4">
      <View className="flex-row gap-4">
        <StatCard value={first?.value ?? 0} label={first?.label ?? "Metric"} />

        <StatCard value={second?.value ?? 0} label={second?.label ?? "Metric"} />
      </View>

      <View className="flex-row gap-4">
        <StatCard value={third?.value ?? 0} label={third?.label ?? "Metric"} />

        <StatCard value={fourth?.value ?? 0} label={fourth?.label ?? "Metric"} />
      </View>
    </View>
  );
}