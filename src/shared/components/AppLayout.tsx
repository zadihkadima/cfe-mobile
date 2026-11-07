import { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";

import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

export function AppLayout({
  children,
}: PropsWithChildren) {
  return (
    <SafeAreaView
      className="flex-1 bg-background dark:bg-dark-background"
      edges={["top", "bottom"]}
    >
      <AppHeader />

      <View className="flex-1 p-[18px]">
        {children}
      </View>

      <BottomNav />
    </SafeAreaView>
  );
}