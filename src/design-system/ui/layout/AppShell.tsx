// src/components/ui/layout/AppShell.tsx

import React, {
  PropsWithChildren,
  useState,
} from "react";

import {
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import { Screen } from "./Screen";

import { AppHeader } from "../navigation/AppHeader";
import { Drawer } from "../navigation/Drawer";
import { useNotifications } from "@/modules/notification/hooks/useNotifications";
import { useUnread } from "@/modules/notification/hooks/useUnread";

interface Props
  extends PropsWithChildren {
  title: string;

  menu: {
    drawerItems: any[];
    drawerBottomItems: any[];
  };

  /**
   * Wraps children in a ScrollView.
   *
   * Off by default, and deliberately so. AppShell is only ever used as an
   * expo-router layout, wrapping whichever route happens to be mounted, so it
   * cannot know whether that route scrolls itself. When it guessed wrong the
   * result was a ScrollView inside a ScrollView, or worse a FlatList inside a
   * ScrollView -- which silently defeats virtualisation, mounts every row at
   * once, and is what React Native's "VirtualizedLists should never be nested"
   * warning was reporting on every list screen in the app.
   *
   * Screens say what they need instead: ScreenScrollView for form-shaped
   * content, or their own FlatList.
   */
  scroll?: boolean;

  refreshing?: boolean;

  onRefresh?(): void;
}

export function AppShell({
  children,
  // Accepted for interface compatibility with SharedLayout but not rendered
  // here; the header owns the title in this shell.
  title: _title,
  menu,
  scroll = false,
  refreshing = false,
  onRefresh,
}: Props) {
  const [drawerOpen, setDrawerOpen] =
    useState(false);
  const { data: notifications } = useNotifications();
  const unread = useUnread();

  const unreadMessages = unread.forKind("message");

  // Messages have their own drawer entry, so they are not counted twice here.
  const unreadNotifications = Math.max(
    (notifications?.unread ?? 0) - unreadMessages,
    0,
  );

  const drawerItems = menu.drawerItems.map(
    (item) => {
      if (item.title === "Messages") {
        return { ...item, badge: unreadMessages };
      }
      if (item.title === "Notifications") {
        return { ...item, badge: unreadNotifications };
      }
      return item;
    },
  );

  return (
    <Screen>
      <View className="flex-1 bg-background dark:bg-dark-background">

        <AppHeader
          onMenu={() => setDrawerOpen(true)}
        />

        {scroll ? (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
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
          // No padding here. The child owns its own scrolling now, and a
          // padded parent would inset the scrollbar and clip the content
          // against an edge the child cannot reach past.
          <View className="flex-1">
            {children}
          </View>
        )}

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