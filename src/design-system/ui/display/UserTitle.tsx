import React from "react";

import {
  Pressable,
  View,
} from "react-native";

import { ChevronRight } from "lucide-react-native";

import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

import { Text } from "../typography";

interface Props {

  name: string;

  subtitle?: string;

  image?: string;

  onPress?(): void;

}

export function UserTile({

  name,

  subtitle,

  image,

  onPress,

}: Props) {

  return (

    <Pressable

      onPress={onPress}

      className="
      flex-row
      items-center
      justify-between
      py-4
      "

    >

      <View
        className="
        flex-row
        items-center
        flex-1
        "
      >

        <Avatar
          name={name}
          image={image}
        />

        <View
          className="
          ml-4
          flex-1
          "
        >

          <Text variant="headline" numberOfLines={1}>
            {name}
          </Text>

          {!!subtitle && (

            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {subtitle}
            </Text>

          )}

        </View>

      </View>

      <Icon as={ChevronRight} size="lg" tone="muted" />

    </Pressable>

  );

}