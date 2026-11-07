import {
  View,
  TouchableOpacity,
  Text,
} from "react-native";

import {
  usePathname,
  useRouter,
} from "expo-router";

import { useSelector } from "react-redux";
import { RootState } from "@/core/store";

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const role = useSelector(
    (state: RootState) => state.auth.user?.role
  );

  const tabs =
    role === "admin"
      ? [
          {
            label: "Dashboard",
            href: "/admin",
          },
          {
            label: "Managers",
            href: "/user/admin/managers",
          },
          {
            label: "Clients",
            href: "/user/admin/clients",
          },
          {
            label: "Workspace",
            href: "/user/admin/workspaces",
          },
        ]
      : role === "manager"
      ? [
          {
            label: "Dashboard",
            href: "/manager",
          },
          {
            label: "Clients",
            href: "/clients",
          },
          {
            label: "Workspace",
            href: "/workspaces",
          },
        ]
      : [
          {
            label: "Dashboard",
            href: "/client",
          },
        ];

  return (
    <View className="h-16 bg-surface dark:bg-dark-surface border-t border-border dark:border-dark-border flex-row">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href;

        return (
          <TouchableOpacity
            key={tab.href}
            className="flex-1 justify-center items-center"
            onPress={() =>
              router.replace(tab.href)
            }
          >
            <Text
              className={
                active
                  ? "font-bold text-primary dark:text-dark-primary"
                  : "font-medium text-text-secondary dark:text-dark-text-secondary"
              }
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}