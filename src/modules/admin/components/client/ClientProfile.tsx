import React from "react";

import {
  View,
  Text,
} from "react-native";

import { Client } from "@/modules/admin/api/client/types";
import { Avatar, CopyableId } from "@/design-system/ui";

type Props = {
  client: Client;
};

export function ClientProfile({
  client,
}: Props) {
  return (
    <View className="bg-surface dark:bg-dark-surface rounded-[12px] p-5 border border-border dark:border-dark-border">
      {/* Beside the name rather than above it. This card is the record of one
          person, and a face is how a reader confirms they opened the one they
          meant to -- particularly among clients with similar names. */}
      <View className="flex-row items-center">
        <Avatar
          size="lg"
          name={`${client.first_name} ${client.last_name}`.trim() || client.email}
          image={client.avatar_url}
        />

        <View className="ml-4 flex-1">
          <Text className="text-2xl font-bold text-text dark:text-dark-text">
            {client.first_name}{" "}
            {client.last_name}
          </Text>

          <Text className="mt-1 text-text-secondary dark:text-dark-text-secondary">
            {client.email}
          </Text>
        </View>
      </View>

      {/* Under the name rather than among the fields below. It identifies the
          record as a whole, where those describe the person. */}
      <View className="mt-1 mb-5 flex-row">
        <CopyableId id={client.id} label="Client" />
      </View>

      <View className="flex-row justify-between py-2">
        <Text className="font-semibold text-text dark:text-dark-text">
          Role
        </Text>

        <Text className="text-text dark:text-dark-text">
          {client.role}
        </Text>
      </View>

      <View className="flex-row justify-between py-2">
        <Text className="font-semibold text-text dark:text-dark-text">
          Active
        </Text>

        <Text className="text-text dark:text-dark-text">
          {client.is_active
            ? "Yes"
            : "No"}
        </Text>
      </View>

      <View className="flex-row justify-between py-2">
        <Text className="font-semibold text-text dark:text-dark-text">
          Invited
        </Text>

        <Text className="text-text dark:text-dark-text">
          {client.invited
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
            client.created_at
          ).toLocaleDateString()}
        </Text>
      </View>

      {/*
        Registration details the client feedback asked to appear on the record:
        birthdate, the firm-assigned code, and why the client came. Each is
        omitted rather than rendered as an empty value, so a field the client
        never filled does not read as a missing record.
      */}
      {client.date_of_birth ? (
        <View className="flex-row justify-between py-2">
          <Text className="font-semibold text-text dark:text-dark-text">
            Date of birth
          </Text>

          <Text className="text-text dark:text-dark-text">
            {new Date(
              `${client.date_of_birth}T00:00:00`
            ).toLocaleDateString()}
          </Text>
        </View>
      ) : null}

      {client.client_code ? (
        <View className="flex-row justify-between py-2">
          <Text className="font-semibold text-text dark:text-dark-text">
            Client code
          </Text>

          <Text className="text-text dark:text-dark-text">
            {client.client_code}
          </Text>
        </View>
      ) : null}

      {client.reason_for_consultation ? (
        <View className="py-2">
          <Text className="font-semibold text-text dark:text-dark-text">
            Reason for consultation
          </Text>

          <Text className="mt-1 text-text dark:text-dark-text">
            {client.reason_for_consultation}
          </Text>
        </View>
      ) : null}
    </View>
  );
}