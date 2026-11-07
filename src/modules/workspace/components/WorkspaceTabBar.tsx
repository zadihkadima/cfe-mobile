import { ScrollView, Text, View, Pressable } from "react-native";

export interface WorkspaceTab {
  key: string;
  label: string;
  /** Shown as a count badge, e.g. outstanding items in that module. */
  badge?: number;
}

interface Props {
  tabs: WorkspaceTab[];
  activeKey: string;
  onChange(key: string): void;
}

/**
 * The workspace module switcher.
 *
 * Horizontal rather than wrapped. A wrapping row of nine pills reflows to three
 * lines, so the tab bar's height changes as the selection moves and the content
 * below it jumps — and on a workspace with long module names it consumed most
 * of the screen before any content rendered at all.
 *
 * A single scrolling row has fixed height, which is what lets the content area
 * below be `flex-1` and stable.
 */
export function WorkspaceTabBar({ tabs, activeKey, onChange }: Props) {
  return (
    <View className="border-b border-border bg-surface dark:border-dark-border dark:bg-dark-surface">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey;

          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              // Announced as a tab in a tab set, with its selected state, so a
              // screen reader user is told which module they are on rather
              // than hearing nine identical buttons.
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={
                tab.badge ? `${tab.label}, ${tab.badge} outstanding` : tab.label
              }
              className={`flex-row items-center border-b-2 px-3 py-3 ${
                active ? "border-primary dark:border-dark-primary" : "border-transparent"
              }`}
            >
              <Text
                className={`text-sm ${
                  active
                    ? "font-bold text-primary dark:text-dark-primary"
                    : "font-medium text-text-secondary dark:text-dark-text-secondary"
                }`}
              >
                {tab.label}
              </Text>

              {tab.badge ? (
                <View className="ml-1.5 min-w-[18px] items-center rounded-full bg-primary px-1.5 py-0.5 dark:bg-dark-primary">
                  <Text className="text-[10px] font-bold text-white">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
