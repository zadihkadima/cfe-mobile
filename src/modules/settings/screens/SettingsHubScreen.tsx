import { useMemo } from "react";
import { Text, View } from "react-native";

import { useRouter } from "expo-router";
import {
  Bell,
  Building2,
  ChevronRight,
  FileBarChart,
  History,
  MonitorSmartphone,
  Palette,
  ShieldCheck,
} from "lucide-react-native";
import { useSelector } from "react-redux";

import { RootState } from "@/core/store";
import { Icon } from "@/design-system/ui";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";
import { PressableScale } from "@/design-system/ui/motion/PressableScale";

type Entry = {
  href: string;
  title: string;
  description: string;
  Icon: typeof Building2;

  /** Roles that may open it. Empty means anyone signed in. */
  roles?: string[];
};

/**
 * Settings is a hub, not a page.
 *
 * The single scrolling page it replaces put the firm's legal details, the
 * device list and a report on one screen, so finding any of them meant reading
 * past the other two -- and saving the firm details from the bottom of a page
 * you had scrolled through for another reason is how the wrong thing gets
 * changed.
 */
const ENTRIES: Entry[] = [
  {
    href: "/user/settings/firm",
    title: "Firm settings",
    description: "Name, legal details, address and nominee contact",
    Icon: Building2,

    // The API registers PATCH /firm on the admin group, so this screen could
    // only ever be read-only for anyone else. Showing an editable form that
    // fails on save is worse than not offering it: the user believes the
    // firm's legal details have changed when they have not.
    roles: ["admin"],
  },
  {
    href: "/user/settings/security",
    title: "Security",
    description: "Two-step sign-in",
    Icon: ShieldCheck,
  },
  {
    href: "/user/settings/appearance",
    title: "Appearance",
    description: "Colour scheme and theme",
    Icon: Palette,

    // No role restriction. The setting is stored on the device and changes
    // nothing anyone else can see, so there is nothing here to withhold.
  },
  {
    href: "/user/settings/push",
    title: "Push notifications",
    description: "What may reach you when the app is closed",
    Icon: Bell,

    // No role restriction. Everybody receives notifications, so everybody has
    // to be able to decide which of them are allowed to interrupt. The server
    // decides which kinds each role is offered, so an administrator simply
    // finds more switches on the same screen.
  },
  {
    href: "/user/settings/sessions",
    title: "Active sessions",
    description: "Where this account is signed in, and how to end it",
    Icon: MonitorSmartphone,
  },
  {
    href: "/user/settings/reports",
    title: "Reports",
    description: "Activity across a date range",
    Icon: FileBarChart,

    // Firm-wide figures are a firm-wide concern. A manager sees their own
    // workspaces on the dashboard already, and a client has one workspace and
    // would only be reading back the screen they came from.
    roles: ["admin"],
  },
  {
    href: "/user/settings/history",
    title: "History",
    description: "Recorded activity for a person, workspace or record",
    Icon: History,

    // The trail records who was denied what, from which address, on whose
    // engagement. A manager reading it would learn about clients they have
    // no relationship with; a client would learn about the firm's internal
    // activity on their file. The API enforces this too -- this only keeps
    // the door from being visible to people it would not open for.
    roles: ["admin"],
  },
];

export function SettingsHubScreen() {
  const router = useRouter();
  const role = useSelector((state: RootState) => state.auth.user?.role);

  const entries = useMemo(
    () => ENTRIES.filter((entry) => !entry.roles || (role && entry.roles.includes(role))),
    [role],
  );

  return (
    <SharedLayout title="Settings">
      <View className="px-4 pt-2">
        {entries.map((entry) => (
          <PressableScale
            key={entry.href}
            onPress={() => router.push(entry.href)}
            className="mb-3 flex-row items-center rounded-2xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface"
          >
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Icon as={entry.Icon} size="lg" tone="primary" />
            </View>

            <View className="flex-1">
              <Text className="text-base font-semibold text-text dark:text-dark-text">
                {entry.title}
              </Text>

              <Text className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
                {entry.description}
              </Text>
            </View>

            <Icon as={ChevronRight} size="md" tone="muted" />
          </PressableScale>
        ))}
      </View>
    </SharedLayout>
  );
}
