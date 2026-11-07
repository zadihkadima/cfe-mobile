import { View, Text, Pressable } from "react-native";

import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { Icon } from "@/design-system/ui";

import { HistoryEntry } from "../api/api";
import { describeAction, historyRoute } from "../lib/describeEntry";

/**
 * How each outcome reads on screen.
 *
 * Named in words rather than shown as a status code. "403" tells an
 * administrator nothing at a glance; "Denied" is the thing they are scanning
 * the column for.
 */
const OUTCOME_LABELS: Record<HistoryEntry["outcome"], string> = {
  success: "Applied",
  denied: "Denied",
  failure: "Failed",
  rejected: "Rejected",
};

function when(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  const router = useRouter();

  if (entries.length === 0) {
    return (
      <View className="rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
        <Text className="text-sm text-text-secondary dark:text-dark-text-secondary">
          No recorded activity for this selection.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {entries.map((entry, index) => {
        const denied = entry.outcome === "denied";
        const action = describeAction(entry);
        const route = historyRoute(entry);

        const body = (
          <View className="flex-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text
                numberOfLines={1}
                className="flex-1 text-sm font-semibold text-text dark:text-dark-text"
              >
                {action}
              </Text>

              {/* Denied attempts are the entries this screen exists for, so
                  they are marked rather than left to be spotted in a column of
                  otherwise identical rows. */}
              <Text
                className={
                  denied
                    ? "text-xs font-semibold text-error"
                    : "text-xs text-text-secondary"
                }
              >
                {OUTCOME_LABELS[entry.outcome]}
              </Text>
            </View>

            <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
              {when(entry.created_at)}
              {entry.actor_role ? ` · ${entry.actor_role}` : ""}
            </Text>
          </View>
        );

        // The concrete request path used to be printed under every row. It was
        // there because the line above it was unreadable -- almost every row
        // said "Updated :id" -- and the path was the only way to work out what
        // had actually happened. Now that the line says so, the path is an
        // implementation detail of the API on a screen for people who
        // administer a firm rather than an API.
        const key = `${entry.request_id ?? "no-request"}-${index}`;

        const className =
          "flex-row items-center rounded-xl border border-border bg-surface p-3 dark:border-dark-border dark:bg-dark-surface";

        // No chevron and no press target when there is nowhere to go. Signing
        // in happened at no record, and a deleted task has nothing left to
        // open; a link that lands on an empty screen makes the reader doubt
        // the record rather than the link.
        if (!route) {
          return (
            <View key={key} className={className}>
              {body}
            </View>
          );
        }

        return (
          <Pressable
            key={key}
            onPress={() => router.push(route)}
            accessibilityRole="button"
            accessibilityLabel={`${action}. Open where this happened.`}
            className={className}
          >
            {body}

            <Icon as={ChevronRight} size="sm" tone="muted" />
          </Pressable>
        );
      })}
    </View>
  );
}
