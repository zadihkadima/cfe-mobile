import { Pressable, Text, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";

import { queryKeys } from "@/core/query/queryKeys";
import { QueryState } from "@/core/components/QueryState";
import { formatRelativeTime } from "@/core/format/formatRelativeTime";
import { RootState } from "@/core/store";
import { Avatar } from "@/design-system/ui/display/Avatar";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";
import { useTheme } from "@/design-system/theme/useTheme";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/api";
import { AppNotification } from "../api/types";
import { useNotifications } from "../hooks/useNotifications";
import { describeNotification } from "../lib/describeNotification";
import { resolveEntityRoute, ViewerRole } from "../lib/notificationRoute";

/**
 * One event, told as a sentence about a person.
 *
 * The row is built around the avatar rather than the text. A notification list
 * is scanned rather than read, and a column of faces down the left edge gives
 * the eye something to track; a column of bold titles does not, because every
 * title is bold.
 *
 * Unread is marked by a dot and by weight, not by a border and a different
 * background. The previous version drew every unread row as a differently
 * coloured box, so at five or more unread the whole screen changed colour and
 * the distinction stopped distinguishing anything.
 */
function NotificationRow({
  notification,
  role,
}: {
  notification: AppNotification;
  role: ViewerRole;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { theme } = useTheme();

  const unread = !notification.read_at;
  const href = resolveEntityRoute(notification, role);
  const { actor, action, workspace, directed } =
    describeNotification(notification);

  const markReadAndOpen = async () => {
    if (unread) {
      // Marking read must not gate the navigation. It used to be awaited
      // first, so a request that failed -- offline, or a token being
      // refreshed -- threw before router.push ran, and the notification
      // simply refused to open with nothing on screen saying why. The badge
      // being briefly wrong is the lesser problem of the two.
      try {
        await markNotificationRead(notification.id);
        await queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all,
        });
      } catch {
        // Left unread; the next open will try again.
      }
    }

    if (href) {
      router.push(href);
    }
  };

  return (
    <Pressable
      className="flex-row items-start gap-3 rounded-2xl px-3 py-3 active:bg-muted dark:active:bg-dark-muted"
      // A row with nowhere to go should not respond to a tap at all, rather
      // than press and stay put, which reads as a broken screen.
      disabled={!href && !unread}
      onPress={() => void markReadAndOpen()}
      accessibilityRole="button"
      // Spoken as one sentence. Left to the default, a reader would hear the
      // name, the action and the time as three separate stops.
      accessibilityLabel={[
        actor,
        action,
        workspace ? `in ${workspace}` : "",
        formatRelativeTime(notification.created_at),
        unread ? "unread" : "",
      ]
        .filter(Boolean)
        .join(", ")}
    >
      <Avatar
        name={actor || notification.title}
        image={notification.actor?.avatar_url}
        size="md"
      />

      <View className="flex-1">
        <Text
          className={`text-base leading-5 ${
            unread
              ? "text-text dark:text-dark-text"
              : "text-text-secondary dark:text-dark-text-secondary"
          }`}
        >
          {actor ? (
            <Text
              className={`${
                unread ? "font-bold" : "font-semibold"
              } text-text dark:text-dark-text`}
            >
              {actor}{" "}
            </Text>
          ) : null}

          {action}
        </Text>

        <View className="mt-1 flex-row items-center gap-2">
          {/*
            The workspace leads the metadata line rather than being appended to
            the sentence. It is what a reader scans for when deciding whether a
            row concerns them at all, and buried at the end of a sentence that
            wraps, it is the first thing lost.
          */}
          {workspace ? (
            <Text
              className="text-xs font-medium text-text dark:text-dark-text"
              numberOfLines={1}
            >
              {workspace}
            </Text>
          ) : null}

          {workspace ? (
            <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
              ·
            </Text>
          ) : null}

          <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
            {formatRelativeTime(notification.created_at)}
          </Text>

          {directed ? (
            <Text
              className="text-xs font-semibold"
              style={{ color: theme.colors.primary }}
            >
              For you
            </Text>
          ) : null}
        </View>
      </View>

      {/*
        A dot rather than a word. It has to be findable while scanning past it
        at speed, and at that speed a shape registers where a label does not.
        The row also says "unread" to a screen reader through the label above,
        so this is not the only way the state is available.
      */}
      {unread ? (
        <View
          className="mt-2 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: theme.colors.primary }}
        />
      ) : null}
    </Pressable>
  );
}

export function NotificationsScreen({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useNotifications();

  // Routes differ by tree: an administrator's workspace screens live under
  // /user/admin. Resolving without this sends them to a screen they cannot
  // open, which reads as a broken notification rather than a wrong link.
  const user = useSelector((state: RootState) => state.auth.user);
  const role: ViewerRole = user?.role ?? "client";
  const markAllRead = async () => {
    await markAllNotificationsRead();
    await queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.all,
    });
  };

  const unread = data?.unread ?? 0;

  const content = (
    <>
      {/*
        The count is stated alongside the action. "Mark all read" on its own
        gives no sense of how much it is about to do, and this is the one
        control on the screen whose effect cannot be undone.
      */}
      {unread > 0 ? (
        <View className="mb-2 flex-row items-center justify-between px-3">
          <Text className="text-sm text-text-secondary dark:text-dark-text-secondary">
            {unread} unread
          </Text>

          <Pressable
            onPress={() => void markAllRead()}
            accessibilityRole="button"
            accessibilityLabel={`Mark all ${unread} notifications as read`}
            className="rounded-full px-3 py-1.5 active:bg-muted dark:active:bg-dark-muted"
          >
            <Text className="text-sm font-semibold text-primary dark:text-dark-primary">
              Mark all read
            </Text>
          </Pressable>
        </View>
      ) : null}

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={!data?.items.length}
        emptyMessage="You have no notifications."
        onRetry={refetch}
      >
        {(data?.items ?? []).map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            role={role}
          />
        ))}
      </QueryState>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <SharedLayout
      title="Notifications"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Notifications" },
      ]}
    >
      {content}
    </SharedLayout>
  );
}
