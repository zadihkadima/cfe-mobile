import React from "react";
import {  View, Text } from "react-native";
// import { useTheme } from "@/design-system/theme/useTheme";
import { Logo } from "@/design-system/ui/brand/Logo";

interface CFELogoProps {
  size?: "small" | "medium" | "large";
}

export function CFELogo({ size = "medium" }: CFELogoProps) {
  //const { theme } = useTheme();
  const sizes = {
    small: { badge: 44, subtitle: 10 },
    medium: { badge: 60, subtitle: 12 },
    large: { badge: 74, subtitle: 14 },
  };

  const currentSize = sizes[size];
  // const shadowStyle =
  //   Platform.OS === "web"
  //     ? { boxShadow: "0px 8px 18px rgba(0, 0, 0, 0.12)" }
  //     : {
  //         shadowColor: "#000",
  //         shadowOffset: { width: 0, height: 8 },
  //         shadowOpacity: 0.12,
  //         shadowRadius: 18,
  //         elevation: 8,
  //       };

  return (
    <View className="items-center gap-3">
      <View
        className="justify-center items-center rounded-[20px] "
        style={{
          width: currentSize.badge,
          height: currentSize.badge,
        }}
      >
        <Logo size={currentSize.badge} showWordmark={false} />
      </View>

      <View className="items-center gap-1">
        <Text
          className="text-text-secondary dark:text-dark-text-secondary"
          style={{
            fontSize: currentSize.subtitle,
            fontWeight: "500",
          }}
        >
          Tax Portal
        </Text>
      </View>
    </View>
  );
}
