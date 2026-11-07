import React from "react";
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { AlertCircle, Home, ArrowLeft, LogOut } from "lucide-react-native";
import { useTheme } from "@/design-system/theme/useTheme";

export default function NotFoundScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const primary = theme.colors.primary;
  const secondary = theme.colors.secondary;
  const border = theme.colors.border;
  const text = theme.colors.text;
  const primaryShadow =
    Platform.OS === "web"
      ? { boxShadow: `0px 10px 25px ${primary}2e` }
      : {
          shadowColor: primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.18,
          shadowRadius: 25,
          elevation: 8,
        };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-background dark:bg-dark-background"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 justify-between items-center px-5 py-10">
        <View className="w-full max-w-xl items-center rounded-[32px] border bg-surface p-8 shadow-2xl dark:border-dark-border dark:bg-dark-surface"
          style={Platform.OS === "web" ? { boxShadow: "0px 10px 25px rgba(0,0,0,0.08)" } : {}}
        >
          <View
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: primary + "22" }}
          >
            <AlertCircle size={56} color={primary} strokeWidth={1.5} />
          </View>

          <Text className="text-5xl font-black text-text dark:text-dark-text">
            404
          </Text>
          <Text className="mt-2 text-center text-3xl font-semibold text-text dark:text-dark-text">
            Page Not Found
          </Text>
          <Text className="mt-4 text-center text-base font-medium leading-7 text-text-muted dark:text-dark-text-muted">
            The page you requested is unavailable. Use one of the actions below to continue safely.
          </Text>

          <View className="mt-8 w-full space-y-3">
            <TouchableOpacity
              className="flex-row items-center justify-center rounded-3xl px-5 py-4"
              style={{
                backgroundColor: primary,
                ...primaryShadow,
              }}
              onPress={() => router.push("/")}
              activeOpacity={0.85}
            >
              <Home size={18} color={theme.colors.textInverted} />
              <Text className="ml-3 text-base font-semibold text-text-inverted">
                Go to Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-center rounded-3xl border px-5 py-4"
              style={{ borderColor: border }}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <ArrowLeft size={18} color={text} />
              <Text className="ml-3 text-base font-semibold text-text dark:text-dark-text">
                Go Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-center rounded-3xl border border-transparent px-5 py-4"
              style={{
                borderColor: secondary,
                backgroundColor: secondary + "15",
              }}
              onPress={() => router.push("/auth/logout")}
              activeOpacity={0.85}
            >
              <LogOut size={18} color={secondary} />
              <Text className="ml-3 text-base font-semibold" style={{ color: secondary }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="mt-6 text-center text-xs font-medium uppercase tracking-[0.3em] text-text-muted dark:text-dark-text-muted">
          Error Code: GLOBAL_404
        </Text>
      </View>
    </ScrollView>
  );
}
