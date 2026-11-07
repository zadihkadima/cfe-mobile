import {
  Bell,
  MessageCircle,
  Search,
} from "lucide-react-native";

import {
  View,
  Text,
} from "react-native";

import { useSelector } from "react-redux";

import { RootState } from "@/core/store";

import { Icon } from "@/design-system/ui";

import { HeaderIconButton } from "./HeaderIconButton";
import { ProfileButton } from "./ProfileButton";

interface Props {
  title: string;
}

export function AppHeader({
  title,
}: Props) {
  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  return (
    <View
      className="
h-20
border-b
border-border
bg-background
px-10
flex-row
items-center
justify-between
"
    >
      <Text
        className="
text-4xl
font-bold
text-text
"
      >
        {title}
      </Text>

      <View
        className="
flex-row
items-center
"
      >
        <HeaderIconButton
          icon={
            <Icon
              as={Search}
              size={23}
            />
          }
        />

        <HeaderIconButton
          badge={12}
          icon={
            <Icon
              as={MessageCircle}
              size={23}
            />
          }
        />

        <HeaderIconButton
          badge={8}
          icon={
            <Icon
              as={Bell}
              size={23}
            />
          }
        />

        <View className="w-5" />

        <ProfileButton
          name={
            user?.id ??
            "User"
          }
        />
      </View>
    </View>
  );
}