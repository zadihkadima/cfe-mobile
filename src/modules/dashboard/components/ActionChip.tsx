import { Pressable, Text } from "react-native";

interface Props {
  title: string;
  onPress?: () => void;
}

export function ActionChip({
  title,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="
      px-5
      py-3
      rounded-full
      bg-primary
      dark:bg-dark-primary
      active:opacity-80
      "
    >
      <Text className="font-semibold text-white">
        {title}
      </Text>
    </Pressable>
  );
}