import React from "react";

import {
  Pressable,
  View,
} from "react-native";

interface Props {

  icon: React.ReactNode;

  badge?: React.ReactNode;

  onPress?(): void;

}

export function HeaderAction({

  icon,

  badge,

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
      "
    >

      <View>

        {icon}

        {badge}

      </View>

    </Pressable>

  );

}