// src/components/ui/navigation/Drawer.tsx

import React, {
  useEffect,
  useRef,
} from "react";

import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DrawerItem, DrawerMenuItem } from "./DrawerItem";
import { useTheme } from "@/design-system/theme/useTheme";

const DRAWER_WIDTH = Math.min(
  Dimensions.get("window").width * 0.82,
  320,
);

const HEADER_HEIGHT = 64;

interface Props {
  drawerItems: DrawerMenuItem[];

  drawerBottomItems: DrawerMenuItem[];

  visible: boolean;

  onClose(): void;
}

export function Drawer({
  drawerItems,
  drawerBottomItems,
  visible,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateX = useRef(
    new Animated.Value(-DRAWER_WIDTH),
  ).current;

  const overlayOpacity = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -DRAWER_WIDTH,
        duration: visible ? 220 : 200,
        useNativeDriver: Platform.OS !== "web",
      }),

      Animated.timing(overlayOpacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 220 : 200,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          zIndex: 1000,
        }}
      >
        {/* Overlay */}

        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.overlay,
            pointerEvents: "none",
            opacity: overlayOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.35],
            }),
          }}
        />

        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={onClose}
        />

        {/* Drawer */}

        <Animated.View
          style={{
            position: "absolute",
            top: insets.top + HEADER_HEIGHT,
            bottom: insets.bottom + 12,
            left: 0,
            width: DRAWER_WIDTH,
            zIndex: 1001,
            backgroundColor: theme.colors.background,
            transform: [
              {
                translateX,
              },
            ],
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background,
            }}
            className="px-5 py-6"
          >
            <View>
              {drawerItems.map((item, index) => (
                <DrawerItem
                  key={`drawer-item-${index}`}
                  item={item}
                  onPress={onClose}
                />
              ))}
            </View>

            <View className="flex-1" />

            <View>
              {drawerBottomItems.map((item, index) => (
                <DrawerItem
                  key={`drawer-bottom-item-${index}`}
                  item={item}
                  onPress={onClose}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}