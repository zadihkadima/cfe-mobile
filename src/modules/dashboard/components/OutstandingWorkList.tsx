import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

import { describeSchedule, isOverdue } from "@/shared/lib/schedule";
import { describeStatus } from "@/shared/lib/workStatus";

import { OutstandingItem, OutstandingKind } from "../api/types";

/**
 * What each kind is called on screen.
 *
 * The server sends machine names; showing "file_request" would leak a database
 * value to a client who is being asked to upload their W-2.
 */
const KIND_LABELS: Record<OutstandingKind, string> = {
  task: "Task",
  checklist: "Checklist",
  file_request: "File Request",
  signature_request: "Signature",
};

type Props = {
  items: OutstandingItem[];
  /** Decides which workspace route a row opens; the two trees differ. */
  role?: string;
};

/**
 * The work waiting on the signed-in person, across every workspace.
 *
 * One list rather than four. Splitting by kind would ask the reader to check
 * four places to find what is due tomorrow, and would hide the single most
 * useful fact this screen can state: the next thing that is late. The server
 * has already merged and ordered them, so the ordering is the same for
 * everyone and does not drift between clients.
 */
export function OutstandingWorkList({ items, role }: Props) {
  const router = useRouter();

  const basePath = role === "admin" ? "/user/admin/workspaces" : "/user/workspaces";

  if (items.length === 0) {
    return (
      <View className="rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
        <Text className="text-sm text-text-secondary dark:text-dark-text-secondary">
          Nothing outstanding. You are all caught up.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {items.map((item) => {
        const late = isOverdue(item);

        return (
          <Pressable
            key={`${item.kind}-${item.id}`}
            onPress={() => router.push(`${basePath}/${item.workspace_id}`)}
            accessibilityRole="button"
            // The label carries the kind and the schedule because a screen
            // reader announces rows in isolation: "Review return" alone does
            // not say whether it is a task or three days late.
            accessibilityLabel={`${KIND_LABELS[item.kind]}: ${item.title}. ${describeSchedule(item)}`}
            className="rounded-xl border border-border bg-surface p-3 dark:border-dark-border dark:bg-dark-surface"
          >
            <View className="flex-row items-center justify-between gap-2">
              <Text
                numberOfLines={1}
                className="flex-1 text-sm font-semibold text-text dark:text-dark-text"
              >
                {item.title}
              </Text>

              {item.assigned_to_me ? (
                <Text className="text-xs font-semibold text-primary">You</Text>
              ) : null}
            </View>

            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                {KIND_LABELS[item.kind]}
              </Text>

              <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
                ·
              </Text>

              <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {describeStatus(item.status)}
              </Text>
            </View>

            {/* Late work is called out in words as well as colour: colour
                alone is invisible to a colour-blind reader and to anyone
                using the app in bright sunlight. */}
            <Text
              className={
                late
                  ? "mt-1 text-xs font-semibold text-error"
                  : "mt-1 text-xs text-text-secondary dark:text-dark-text-secondary"
              }
            >
              {late ? `Overdue — ${describeSchedule(item)}` : describeSchedule(item)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
