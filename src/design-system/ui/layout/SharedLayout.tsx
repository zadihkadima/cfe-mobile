import React, { PropsWithChildren, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import { Screen } from "./Screen";
import { KeyboardAvoidingContainer } from "./KeyboardAvoidingContainer";
import { AppHeader } from "../navigation/AppHeader";
import { Drawer } from "../navigation/Drawer";
import { Breadcrumbs, BreadcrumbItem } from "../navigation/Breadcrumbs";
import { useNotifications } from "@/modules/notification/hooks/useNotifications";
import { useUnread } from "@/modules/notification/hooks/useUnread";
import { useSelector } from "react-redux";
import { RootState } from "@/core/store";
import { clientMenu } from "../navigation/menuData";
import { managerMenu } from "../navigation/menuData";
import { adminMenu } from "../navigation/menuData";

interface Props extends PropsWithChildren {
  title: string;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?(): void;
  breadcrumbs?: BreadcrumbItem[];
}

export function SharedLayout({
  children,
  // Accepted for interface compatibility but not rendered here; breadcrumbs
  // carry the page identity in this layout.
  title: _title,
  scroll = true,
  refreshing = false,
  onRefresh,
  breadcrumbs = [],
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  let menu = clientMenu;
  if (user?.role === "manager") menu = managerMenu;
  else if (user?.role === "admin") menu = adminMenu;

  const { data: notifications } = useNotifications();
  const unread = useUnread();

  const unreadMessages = unread.forKind("message");

  // Messages have their own entry in the drawer, so counting them here as well
  // would light up two rows for one new message.
  const unreadNotifications = Math.max(
    (notifications?.unread ?? 0) - unreadMessages,
    0,
  );

  const drawerItems = menu.drawerItems.map((item) => {
    if (item.title === "Messages") {
      return { ...item, badge: unreadMessages };
    }
    if (item.title === "Notifications") {
      return { ...item, badge: unreadNotifications };
    }
    return item;
  });

  return (
    <Screen>
      <View className="flex-1 bg-background dark:bg-dark-background">
        <AppHeader
          onMenu={() => setDrawerOpen(true)}
        />

        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

        <KeyboardAvoidingContainer className="flex-1">
          {scroll ? (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{
                padding: 24,
                paddingBottom: 40,
              }}
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                ) : undefined
              }
            >
              {children}
            </ScrollView>
          ) : (
            <View className="flex-1 px-6 pt-6">
              {children}
            </View>
          )}
        </KeyboardAvoidingContainer>

        <Drawer
          drawerItems={drawerItems}
          drawerBottomItems={menu.drawerBottomItems}
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </View>
    </Screen>
  );
}
