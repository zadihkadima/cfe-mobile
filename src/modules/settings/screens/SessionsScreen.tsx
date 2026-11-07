import { Alert, Text, View } from "react-native";

import { useRouter } from "expo-router";
import { LogOut, MonitorSmartphone, Smartphone } from "lucide-react-native";

import { QueryState } from "@/core/components/QueryState";
import { Icon } from "@/design-system/ui";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";
import { PressableScale } from "@/design-system/ui/motion/PressableScale";

import { ActiveSession, useRevokeAllSessions, useRevokeSession, useSessions } from "../api/sessions";

/**
 * Turns a user-agent string into something a person can recognise.
 *
 * The raw value is unreadable, and a list of unreadable rows is a list nobody
 * audits -- which makes the feature decorative.
 */
function describeDevice(agent: string): string {
  if (!agent) {
    return "Unknown device";
  }

  const platform = /iPhone|iPad|iOS/i.test(agent)
    ? "iPhone or iPad"
    : /Android/i.test(agent)
      ? "Android"
      : /Macintosh|Mac OS/i.test(agent)
        ? "Mac"
        : /Windows/i.test(agent)
          ? "Windows"
          : null;

  const browser = /Chrome/i.test(agent)
    ? "Chrome"
    : /Safari/i.test(agent)
      ? "Safari"
      : /Firefox/i.test(agent)
        ? "Firefox"
        : null;

  if (platform && browser) {
    return `${browser} on ${platform}`;
  }

  if (platform) {
    return platform;
  }

  // Falls back to the raw string rather than "Unknown": an unfamiliar agent is
  // exactly the row worth showing in full, because it is the one that might
  // not be yours.
  return agent.slice(0, 48);
}

function relative(iso: string): string {
  const then = new Date(iso).getTime();
  const minutes = Math.round((Date.now() - then) / 60000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.round(hours / 24)}d ago`;
}

function SessionRow({
  session,
  onRevoke,
  revoking,
}: {
  session: ActiveSession;
  onRevoke(): void;
  revoking: boolean;
}) {
  return (
    <View className="mb-3 flex-row items-center rounded-2xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        {session.current ? (
          <Icon as={Smartphone} size="md" tone="primary" />
        ) : (
          <Icon as={MonitorSmartphone} size="md" tone="primary" />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-sm font-semibold text-text dark:text-dark-text">
          {describeDevice(session.device)}
          {session.current ? " · This device" : ""}
        </Text>

        <Text className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
          Last used {relative(session.last_used_at)}
        </Text>
      </View>

      {/* The current device is not offered a sign-out button here. Signing out
          of the app is a separate, obvious action, and a row that ends the
          session you are reading it on looks like it ends a different one. */}
      {!session.current ? (
        <PressableScale onPress={onRevoke} disabled={revoking} hitSlop={8} className="pl-3">
          <Text className="text-xs font-semibold text-danger">
            {revoking ? "Ending…" : "Sign out"}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

export function SessionsScreen() {
  const router = useRouter();
  const query = useSessions();
  const revoke = useRevokeSession();
  const revokeAll = useRevokeAllSessions();

  const confirmRevokeAll = () => {
    Alert.alert(
      "Sign out everywhere?",
      "This ends every session, including this one. You will need to sign in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out everywhere",
          style: "destructive",
          // Alert's action handler is typed as returning void, so the promise
          // is discarded explicitly. mutateAsync rejects on failure, and an
          // unhandled rejection here would be silent in a release build, so
          // the failure is caught and surfaced rather than dropped.
          onPress: () => {
            void (async () => {
              try {
                await revokeAll.mutateAsync();
              } catch {
                // The mutation's own error state drives the visible message;
                // nothing further is actionable here, but the rejection must
                // still be consumed so it does not escape unhandled.
                return;
              }

              // Sent to the sign-out route rather than the login screen, so the
              // stored tokens are cleared too. Navigating straight to login
              // would leave a dead token on the device that every request then
              // retries with.
              router.replace("/auth/logout");
            })();
          },
        },
      ],
    );
  };

  return (
    <SharedLayout title="Active sessions">
      <View className="px-4 pt-2">
        <Text className="mb-4 text-xs text-text-secondary dark:text-dark-text-secondary">
          Each row is a device signed in to this account. If you do not recognise one, sign it out
          and change your password.
        </Text>

        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={(query.data?.length ?? 0) === 0}
          emptyMessage="No other sessions"
          emptyDescription="This account is only signed in here."
          skeletonCount={3}
          onRetry={query.refetch}
        >
          {(query.data ?? []).map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              revoking={revoke.isPending && revoke.variables === session.id}
              onRevoke={() => revoke.mutate(session.id)}
            />
          ))}

          {(query.data?.length ?? 0) > 1 ? (
            <PressableScale
              onPress={confirmRevokeAll}
              className="mt-2 flex-row items-center justify-center rounded-2xl border border-danger/40 p-4"
            >
              <Icon as={LogOut} size="sm" tone="danger" />

              <Text className="ml-2 text-sm font-semibold text-danger">Sign out everywhere</Text>
            </PressableScale>
          ) : null}
        </QueryState>
      </View>
    </SharedLayout>
  );
}
