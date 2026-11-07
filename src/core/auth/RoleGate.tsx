import { ReactNode } from "react";
import { Text, View } from "react-native";

import { ShieldAlert } from "lucide-react-native";
import { useSelector } from "react-redux";

import { RootState } from "@/core/store";
import { Icon } from "@/design-system/ui";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";

type Props = {
  roles: string[];
  title: string;
  children: ReactNode;
};

/**
 * Refuses a screen to roles that may not use it.
 *
 * Hiding the entry in the hub is not enough on its own. A deep link, a stale
 * push notification, or the back stack after a role change all reach the
 * screen directly, and the firm settings form in particular would then render
 * as editable and fail only on save -- by which point the user believes the
 * firm's legal details have been changed.
 *
 * This is presentation, not protection. The API enforces the same rules, and
 * has to: anyone can call it without going through this app at all.
 */
export function RoleGate({ roles, title, children }: Props) {
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const hydrated = useSelector((state: RootState) => state.auth.hydrated);

  // Nothing is rendered until the stored session has been read back. Deciding
  // on an empty role would flash "not available" on every cold start for the
  // very users who are allowed in.
  if (!hydrated) return null;

  if (role && roles.includes(role)) {
    return <>{children}</>;
  }

  return (
    <SharedLayout title={title}>
      <View className="flex-1 items-center justify-center px-8 py-16">
        <Icon as={ShieldAlert} size="display" tone="muted" />

        <Text className="mt-4 text-center text-base font-semibold text-text dark:text-dark-text">
          Not available for your account
        </Text>

        <Text className="mt-2 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
          This section is limited to firm administrators.
        </Text>
      </View>
    </SharedLayout>
  );
}
