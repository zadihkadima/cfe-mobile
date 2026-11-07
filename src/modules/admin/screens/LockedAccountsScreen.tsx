import React from "react";

import { ScrollView, Text, View } from "react-native";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react-native";

import { api } from "@/core/api/client";
import { QueryState } from "@/core/components/QueryState";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { store } from "@/core/store";
import { showError } from "@/core/store/notificationSlice";
import { Avatar, Icon } from "@/design-system/ui";
import { PressableScale } from "@/design-system/ui/motion/PressableScale";
import { Client } from "@/modules/admin/api/client/types";
import { Manager } from "@/modules/admin/api/manager/types";
import { useClients } from "@/modules/admin/hooks/client/useClients";
import { useManagers } from "@/modules/admin/hooks/manager/useManagers";

const lockedAccountsFilter = { page: 1, limit: 100, locked: true };
type LockedAccount = Client | Manager;

function LockedAccountRow({ account }: { account: LockedAccount }) {
  const queryClient = useQueryClient();
  const name = `${account.first_name} ${account.last_name}`.trim() || account.email;
  const unlock = useMutation({
    mutationFn: () => api.post(`/admin/users/${account.id}/unlock`),
    onSuccess: () => void queryClient.invalidateQueries(),
    onError: (error) => store.dispatch(showError(normalizeApiError(error).message)),
  });
  const unlockError = unlock.isError ? normalizeApiError(unlock.error).message : undefined;

  return (
    <View className="flex-row items-center rounded-2xl border border-danger/30 bg-surface p-4 dark:bg-dark-surface">
      <Avatar name={name} image={account.avatar_url} />
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-text dark:text-dark-text">{name}</Text>
        <Text className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
          {account.email}
        </Text>
        <Text className="mt-1 text-xs font-medium text-danger">
          Locked {account.locked_at ? new Date(account.locked_at).toLocaleString() : ""}
        </Text>
        {unlockError ? <Text className="mt-1 text-xs text-danger">{unlockError}</Text> : null}
      </View>
      <PressableScale disabled={unlock.isPending} hitSlop={8} onPress={() => unlock.mutate()}>
        <View className="flex-row items-center rounded-xl bg-primary px-3 py-2">
          <Icon as={Lock} size="sm" tone="inverted" />
          <Text className="ml-1.5 text-xs font-semibold text-white">
            {unlock.isPending ? "Unlocking…" : "Unlock"}
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

// Locked accounts must be fetched through a server-side filter. Filtering the
// ordinary paginated directories on-device would silently miss a locked person
// who happened to be on a later page.
export function LockedAccountsScreen() {
  const managers = useManagers(lockedAccountsFilter);
  const clients = useClients(lockedAccountsFilter);
  const isLoading = managers.isLoading || clients.isLoading;
  const isError = managers.isError || clients.isError;
  const error = managers.error ?? clients.error;
  const accounts = [...(managers.data?.items ?? []), ...(clients.data?.items ?? [])].filter(
    (account) => Boolean(account.locked_at),
  );

  return (
    <ScrollView className="flex-1 bg-background dark:bg-dark-background" contentContainerClassName="p-5">
      <Text className="text-2xl font-bold text-text dark:text-dark-text">Locked accounts</Text>
      <Text className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">
        Unlock an account only after confirming the requester’s identity.
      </Text>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={!isLoading && !isError && accounts.length === 0}
        emptyMessage="No locked accounts"
        emptyDescription="Accounts locked after five unsuccessful sign-in attempts appear here."
        onRetry={() => Promise.all([managers.refetch(), clients.refetch()])}
      >
        <View className="mt-5 gap-2">
          {accounts.map((account) => (
            <LockedAccountRow key={account.id} account={account} />
          ))}
        </View>
      </QueryState>
    </ScrollView>
  );
}