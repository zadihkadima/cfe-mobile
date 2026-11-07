import { View, Text } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/core/store";

export function AppHeader() {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  return (
    <View className="h-16 bg-surface dark:bg-dark-surface px-[18px] flex-row justify-between items-center border-b border-border dark:border-dark-border">
      <Text className="text-xl font-bold text-text dark:text-dark-text">
        CFE Portal
      </Text>

      <View>
        <Text className="text-right font-semibold text-text dark:text-dark-text">
          {user?.email}
        </Text>

        <Text className="text-right text-xs capitalize text-text-secondary dark:text-dark-text-secondary">
          {user?.role}
        </Text>
      </View>
    </View>
  );
}