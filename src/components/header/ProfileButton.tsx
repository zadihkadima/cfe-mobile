import { ChevronDown } from "lucide-react-native";

import {
  Pressable,
  Text,
  View,
} from "react-native";

import { Icon } from "@/design-system/ui";

interface Props {
  name: string;
  onPress?: () => void;
}

export function ProfileButton({
  name,
  onPress,
}: Props) {
  const initials = name
    .split(" ")
    .map((v) => v[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      className="
flex-row
items-center
"
    >
      <View
        className="
w-11
h-11
rounded-full
bg-primary
items-center
justify-center
"
      >
        <Text
          className="
text-white
font-bold
"
        >
          {initials}
        </Text>
      </View>

      <Text
        className="
mx-3
font-medium
text-text
"
      >
        {name}
      </Text>

      <Icon
        as={ChevronDown}
        size="md"
        tone="muted"
      />
    </Pressable>
  );
}