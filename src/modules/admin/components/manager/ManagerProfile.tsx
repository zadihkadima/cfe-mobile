import React from "react";

import {
  View,
  Text,
} from "react-native";

import { Manager } from "@/modules/admin/api/manager/types";
import { Avatar, CopyableId } from "@/design-system/ui";

type Props = {
  manager: Manager;
};

export function ManagerProfile({
  manager,
}: Props) {
  return (
    <View className="bg-surface dark:bg-dark-surface rounded-[12px] p-5 border border-border dark:border-dark-border">
      {/* Beside the name rather than above it. This card is the record of one
          person, and a face is how a reader confirms they opened the one they
          meant to. */}
      <View className="flex-row items-center">
        <Avatar
          size="lg"
          name={
            `${manager.first_name} ${manager.last_name}`.trim() || manager.email
          }
          image={manager.avatar_url}
        />

        <View className="ml-4 flex-1">
          <Text className="text-2xl font-bold text-text dark:text-dark-text">
            {manager.first_name}{" "}
            {manager.last_name}
          </Text>

          <Text className="mt-1 text-text-secondary dark:text-dark-text-secondary">
            {manager.email}
          </Text>
        </View>
      </View>

      <View className="mt-1 mb-5 flex-row">
        <CopyableId id={manager.id} label="Manager" />
      </View>

      <View className="flex-row justify-between py-2">
        <Text className="font-semibold text-text dark:text-dark-text">
          Role
        </Text>

        <Text className="text-text dark:text-dark-text">
          {manager.role}
        </Text>
      </View>

      <View className="flex-row justify-between py-2">
        <Text className="font-semibold text-text dark:text-dark-text">
          Active
        </Text>

        <Text className="text-text dark:text-dark-text">
          {manager.is_active
            ? "Yes"
            : "No"}
        </Text>
      </View>

      <View className="flex-row justify-between py-2">
        <Text className="font-semibold text-text dark:text-dark-text">
          Invited
        </Text>

        <Text className="text-text dark:text-dark-text">
          {manager.invited
            ? "Yes"
            : "No"}
        </Text>
      </View>

      <View className="flex-row justify-between py-2">
        <Text className="font-semibold text-text dark:text-dark-text">
          Created
        </Text>

        <Text className="text-text dark:text-dark-text">
          {new Date(
            manager.created_at
          ).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}