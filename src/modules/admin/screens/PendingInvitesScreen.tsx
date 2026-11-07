import React from "react";
import { View, Text, FlatList } from "react-native";
import { useRouter } from "expo-router";

import { useClients } from "@/modules/admin/hooks/client/useClients";
import { useManagers } from "@/modules/admin/hooks/manager/useManagers";
import { PersonRow } from "@/modules/admin/components/PersonRow";
import { resendInvite } from "@/modules/admin/api/users";

export function PendingInvitesScreen() {
  const router = useRouter();

  const clients = useClients({ page: 1, limit: 100, invited: true });
  const managers = useManagers({ page: 1, limit: 100, invited: true });

  return (
    <View className="flex-1 p-4 bg-background dark:bg-dark-background">
      <Text className="text-2xl font-bold text-text dark:text-dark-text mb-4">Pending Invites</Text>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="mb-2 text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">Managers</Text>
          <FlatList
            data={managers.data?.items ?? []}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <PersonRow
                person={item}
                onPress={() => router.push(`/user/admin/managers/${item.id}`)}
                onResend={async (id) => await resendInvite(id)}
              />
            )}
          />
        </View>

        <View className="flex-1">
          <Text className="mb-2 text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">Clients</Text>
          <FlatList
            data={clients.data?.items ?? []}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <PersonRow
                person={item}
                onPress={() => router.push(`/user/admin/clients/${item.id}`)}
                onResend={async (id) => await resendInvite(id)}
              />
            )}
          />
        </View>
      </View>
    </View>
  );
}
