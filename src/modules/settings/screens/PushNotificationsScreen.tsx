import { Switch, Text, View } from "react-native";

import { Bell } from "lucide-react-native";

import { QueryState } from "@/core/components/QueryState";
import { Icon } from "@/design-system/ui";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";

import {
  usePushSettings,
  useSavePushSettings,
} from "../hooks/usePushSettings";

/**
 * What each kind is called, and what it means.
 *
 * Held here rather than sent by the server because it is wording, not
 * configuration: a translation belongs in the app, and a kind the server knows
 * about but this list does not still renders -- see the fallback below.
 */
const LABELS: Record<string, { title: string; description: string }> = {
  message: {
    title: "Messages",
    description: "Someone sends a message in a workspace",
  },
  task: {
    title: "Tasks",
    description: "A task is assigned to you or updated",
  },
  checklist: {
    title: "Checklists",
    description: "A checklist item needs your attention",
  },
  file_request: {
    title: "File requests",
    description: "You are asked to upload something",
  },
  signature_request: {
    title: "Signature requests",
    description: "You are asked to sign something",
  },
  workspace_file: {
    title: "Files",
    description: "A file is added to a workspace",
  },
  questionnaire: {
    title: "Questionnaires",
    description: "A questionnaire is sent or answered",
  },
  irs_submission: {
    title: "IRS submissions",
    description: "A submission changes state",
  },
  account: {
    title: "Accounts",
    description: "People join, are locked out or change role",
  },
  security: {
    title: "Security",
    description: "Failed sign-ins and two-step changes",
  },
};

/**
 * Turns a kind into something readable when the wording above has no entry.
 *
 * A kind added on the server before this app ships would otherwise render as a
 * blank row with a working switch, which is worse than an imperfect label.
 */
function fallbackLabel(kind: string) {
  const words = kind.replace(/_/g, " ");

  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function PushNotificationsScreen() {
  const { data, isLoading, isError, error, refetch } = usePushSettings();
  const save = useSavePushSettings();

  if (isLoading || isError || !data) {
    return (
      <SharedLayout title="Push notifications">
        <View className="p-4">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
          />
        </View>
      </SharedLayout>
    );
  }

  /*
   * The whole map is sent, not the one switch that moved.
   *
   * The server stores what it is given, so sending a single kind would erase
   * every other choice -- and the failure would be invisible until somebody
   * noticed they had stopped being told about something.
   */
  const toggle = (kind: string, wanted: boolean) => {
    save.mutate({ ...data.kinds, [kind]: wanted });
  };

  return (
    <SharedLayout title="Push notifications">
      <View className="px-4 pt-2">
        <Text className="mb-4 text-xs text-text-secondary dark:text-dark-text-secondary">
          Choose what may reach you when the app is closed. Everything still
          appears in the app either way.
        </Text>

        {/* Driven by what the server offers rather than by the wording above,
            so the list an administrator sees is decided in one place and a new
            kind does not need a new app to become switchable. */}
        {data.available.map((kind) => {
          const label = LABELS[kind] ?? {
            title: fallbackLabel(kind),
            description: "",
          };

          return (
            <View
              key={kind}
              className="mb-3 flex-row items-center rounded-2xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface"
            >
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <Icon as={Bell} size="lg" tone="primary" />
              </View>

              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-text dark:text-dark-text">
                  {label.title}
                </Text>

                {label.description ? (
                  <Text className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
                    {label.description}
                  </Text>
                ) : null}
              </View>

              <Switch
                value={!!data.kinds[kind]}
                onValueChange={(wanted) => {
                  toggle(kind, wanted);
                }}
                /* Says what the switch does, not merely what it is beside.
                   The title alone reads as "Messages" to a screen reader,
                   which is both ambiguous on a settings screen and identical
                   to the messages button in the header above it. */
                accessibilityLabel={`Push notifications for ${label.title.toLowerCase()}`}
              />
            </View>
          );
        })}
      </View>
    </SharedLayout>
  );
}
