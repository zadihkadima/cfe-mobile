import React from "react";
import { TextInput, TextInputProps } from "react-native";

import { useTheme } from "@/design-system/theme/useTheme";

export function ThemedTextInput(props: TextInputProps) {
  const { theme } = useTheme();
  const { placeholderTextColor, ...rest } = props;

  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? theme.colors.textMuted}
      {...rest}
    />
  );
}
