import { Menu, Bell, MessageCircle, Moon, Sun } from "lucide-react-native";
import { Modal, Pressable, Text, View } from "react-native";
import { useState } from "react";

import { useSelector } from "react-redux";
import { RootState } from "@/core/store";
import { Logo } from "@/design-system/ui/brand/Logo";
import { useTheme } from "@/design-system/theme/useTheme";
import { useNotifications } from "@/modules/notification/hooks/useNotifications";
import { useUnread } from "@/modules/notification/hooks/useUnread";
import { Avatar } from "@/design-system/ui/display/Avatar";
import { endSession } from "@/core/auth/endSession";
import { router, usePathname } from "expo-router";

interface Props {
  onMenu(): void;

  onMessages?(): void;

  onNotifications?(): void;

  onProfile?(): void;
}

/**
 * A round tap target holding a single glyph.
 *
 * `label` is required rather than optional because an icon carries no text:
 * every one of these was previously unlabelled, so a screen reader announced
 * the entire header as four anonymous buttons and the only way to find the
 * menu was to guess. An icon that cannot be named does not belong here.
 */
function IconButton({
  children,
  label,
  active = false,
  onPress,
}: {
  children: React.ReactNode;
  label: string;
  /**
   * Whether this button leads to the screen already on display.
   *
   * Messages and notifications are the two controls here that a person can
   * press while already standing on their destination. Without an answer to
   * "am I there?", the only feedback is that nothing happens -- which reads
   * as a dead button rather than as an arrival.
   */
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      // Announced as well as drawn. A tint means nothing to a screen reader,
      // and `selected` is the word the platform already has for this.
      accessibilityState={{ selected: active }}
      className={`
      w-11
      h-11
      rounded-full
      items-center
      justify-center
      active:bg-muted

      ${active ? "bg-primary/10 dark:bg-dark-primary/10" : ""}
      `}
    >
      {children}
    </Pressable>
  );
}

function Badge({
  count,
}: {
  count: number;
}) {
  if (!count) return null;

  return (
    <View
      className="
      absolute
      -right-1
      -top-1
      min-w-[18px]
      h-[18px]
      rounded-full
      bg-danger
      dark:bg-dark-danger
      items-center
      justify-center
      px-1
      "
    >
      <Text
        className="
        text-[10px]
        text-white
        font-bold
        "
      >
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}

export function AppHeader({
  onMenu,
  onMessages,
  onNotifications,
  onProfile,
}: Props) {
  const pathname = usePathname();

  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  const { mode, setMode, theme } = useTheme();
  const iconColor =
    theme.colors.textMuted;

  const { data: notifications } = useNotifications();
  const unread = useUnread();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const unreadMessages = unread.forKind("message");

  /*
   * Taken as given rather than adjusted here.
   *
   * This used to subtract the message count, because messages were being
   * written into the general list and counted in the bell as well as in their
   * own icon beside it. The server now keeps conversation traffic out of that
   * list entirely, so subtracting again would take the same messages off twice
   * and show too low a number.
   */
  const unreadNotifications = notifications?.unread ?? 0;

  const profileName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim();

  /*
   * Signing out goes through the shared teardown rather than repeating it.
   *
   * This used to clear the tokens and the store by hand, which meant it also
   * had to remember to revoke the session on the server and to withdraw this
   * handset from push -- and it did neither. A copy that forgets a step leaves
   * somebody looking signed out while a usable credential, and a live push
   * registration, are still on the device.
   */
  const handleLogout = () => {
    setProfileMenuOpen(false);
    endSession();
  };

  const openProfileMenu = () => {
    if (onProfile) {
      onProfile();
      return;
    }

    setProfileMenuOpen(true);
  };

  const toggleDarkMode = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  const navigateTo = (href: string) => {
    if (pathname === href) {
      return;
    }

    router.navigate(href);
  };

  const rolePath = `/user/${user?.role ?? "client"}`;

  const messagesHref = `${rolePath}/messages`;
  const notificationsHref = `${rolePath}/notifications`;

  /*
   * Active means "this button leads to the screen you are looking at".
   *
   * Matched exactly rather than by prefix, which is why the destinations are
   * named here instead of being built inline at each button. These two open
   * the role's own inbox, so a workspace conversation at
   * `/user/workspaces/42/messages` is a different place: lighting the icon
   * there would tell somebody they had arrived somewhere they had not, and
   * pressing it would then move them -- the one thing an active control
   * promises not to do.
   */
  const onMessagesScreen = pathname === messagesHref;
  const onNotificationsScreen = pathname === notificationsHref;

  // Idle glyphs stay muted. An active one takes the brand colour, so the tint
  // behind it and the glyph on it are saying the same thing rather than the
  // background alone carrying it.
  const activeIconColor = theme.colors.primary;

  return (
    <View
      className="
      h-16
      border-b
      border-border
      dark:border-dark-border
      bg-background
      dark:bg-dark-background
      px-4
      flex-row
      items-center
      justify-between
      "
    >
      {/* Left */}

      <View className="flex-row items-center">

        <IconButton onPress={onMenu} label="Open menu">
          <Menu
            size={24}
            color={iconColor}
          />
        </IconButton>

        {/* The brand, not the page name. The breadcrumbs directly below
            already say where you are, so the title was the same words twice,
            and it was the widest thing in the row -- long screen names pushed
            the icons off the right edge on a small phone. */}
        <Pressable
          onPress={() => navigateTo(rolePath)}
          accessibilityRole="button"
          accessibilityLabel="CFE home"
          className="ml-2"
        >
          <Logo size={30} showWordmark />
        </Pressable>

      </View>

      {/* Right */}

      <View className="flex-row items-center">

        <IconButton
          onPress={toggleDarkMode}
          // Named for what pressing it does, not for the state it is in. "Dark
          // mode" leaves the listener to work out whether it is a description
          // or an offer.
          label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {mode === "dark" ? (
            <Sun
              size={22}
              color={iconColor}
            />
          ) : (
            <Moon
              size={22}
              color={iconColor}
            />
          )}
        </IconButton>

        {/* There was a search button here. Nothing ever passed onSearch, so
            it was a control that looked available and did nothing when
            pressed -- worse than absent, because it invites the tap. Search
            belongs on the lists that can actually be searched, where it
            already is. */}

        <View>

          <IconButton
            // The badge is a visual count; without it in the label a screen
            // reader gets "Messages" whether there are none or nine.
            label={
              unreadMessages > 0
                ? `Messages, ${unreadMessages} unread`
                : "Messages"
            }
            active={onMessagesScreen}
            onPress={
              onMessages ??
              (() => navigateTo(messagesHref))
            }
          >
            <MessageCircle
              size={22}
              color={onMessagesScreen ? activeIconColor : iconColor}
            />
          </IconButton>

          <Badge
            count={unreadMessages}
          />

        </View>

        <View className="ml-1">

          <IconButton
            label={
              unreadNotifications > 0
                ? `Notifications, ${unreadNotifications} unread`
                : "Notifications"
            }
            active={onNotificationsScreen}
            onPress={
              onNotifications ??
              (() => navigateTo(notificationsHref))
            }
          >
            <Bell
              size={22}
              color={onNotificationsScreen ? activeIconColor : iconColor}
            />
          </IconButton>

          <Badge
            count={unreadNotifications}
          />

        </View>
 
        <Pressable
          onPress={openProfileMenu}
          accessibilityRole="button"
          accessibilityLabel="Account"
          className="ml-3"
        >
          {/* The picture comes from the signed-in record, which `/auth/me`
              already fills in and which the upload hook refreshes -- so it does
              not cost a request from a header that renders on every route.

              Avatar rather than a hand-rolled circle of initials: it already
              falls back to initials when there is no picture, and derives them
              correctly for a middle name and for an email address. The version
              here took the first letter of the first two words, so "Ada B
              Lovelace" read as "AB". */}
          <Avatar name={profileName || user?.email} image={user?.avatar_url} />
        </Pressable>
      </View>

      <Modal
        visible={profileMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileMenuOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/20"
          onPress={() => setProfileMenuOpen(false)}
        >
          <View className="absolute top-16 right-4 w-48 rounded-3xl border border-border bg-white dark:border-dark-border dark:bg-dark-surface p-2 shadow-2xl">
            <Pressable
              onPress={() => {
                setProfileMenuOpen(false);
                router.push("/user/profile");
              }}
              className="rounded-2xl px-3 py-3"
            >
              <Text className="text-text dark:text-dark-text">View Profile</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setProfileMenuOpen(false);
                router.push("/user/profile/edit");
              }}
              className="rounded-2xl px-3 py-3"
            >
              <Text className="text-text dark:text-dark-text">Edit Profile</Text>
            </Pressable>

            <View className="my-1 h-px bg-border dark:bg-dark-border" />

            <Pressable
              onPress={handleLogout}
              className="rounded-2xl px-3 py-3"
            >
              <Text className="text-danger dark:text-dark-danger">Logout</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
