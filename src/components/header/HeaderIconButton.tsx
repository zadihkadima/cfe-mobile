import { Pressable, View } from "react-native";

import { HeaderBadge } from "./HeaderBadge";

interface Props {
  icon: React.ReactNode;
  badge?: number;
  onPress?: () => void;
}

export function HeaderIconButton({
  icon,
  badge = 0,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="
w-11
h-11
items-center
justify-center
rounded-full
active:bg-muted
"
    >
      <View>

        {icon}

        <HeaderBadge
          count={badge}
        />

      </View>
    </Pressable>
  );
}