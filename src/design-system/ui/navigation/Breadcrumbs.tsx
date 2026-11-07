import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "@/design-system/theme/useTheme";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const textMuted = theme.colors.textMuted;

  if (!items || items.length === 0) return null;

  return (
    <View className="flex-row items-center px-6 py-3 bg-background dark:bg-dark-background border-b border-border dark:border-dark-border gap-1">
      {items.map((item, idx) => (
        <View key={idx} className="flex-row items-center">
          {idx > 0 && (
            <ChevronRight
              size={16}
              color={textMuted}
              style={{ marginHorizontal: 8 }}
            />
          )}
          {item.href ? (
            <Pressable onPress={() => router.push(item.href!)}>
              <Text className="text-sm font-medium text-primary dark:text-dark-primary">
                {item.label}
              </Text>
            </Pressable>
          ) : (
            <Text className="text-sm font-medium text-text dark:text-dark-text">
              {item.label}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
