import React from "react";
import {
  Pressable,
  Text,
} from "react-native";

interface Props {
  value: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
}

export function StatCard({
  value,
  label,
  subtitle,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="
      flex-1
      bg-surface
      dark:bg-dark-surface
      border
      border-border
      dark:border-dark-border
      rounded-2xl
      p-5
      active:opacity-80
      "
    >
      <Text
        className="
        text-4xl
        font-bold
        text-text
        dark:text-dark-text
        "
      >
        {value}
      </Text>

      <Text
        className="
        mt-2
        text-base
        font-semibold
        text-text
        dark:text-dark-text
        "
      >
        {label}
      </Text>

      {subtitle && (
        <Text
          className="
          mt-2
          text-sm
          text-text-secondary
          dark:text-dark-text-secondary
          "
        >
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}