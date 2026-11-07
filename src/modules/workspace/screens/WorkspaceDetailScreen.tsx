import { useCallback, useMemo, useState } from "react";

import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { Pencil, ArrowUpFromLine } from "lucide-react-native";

import { useWorkspace } from "../hooks/useWorkspace";
import { useWorkspaceClientDetails } from "../hooks/useWorkspaceClientDetails";
import { QueryState } from "@/core/components/QueryState";
import { CopyableId, Icon } from "@/design-system/ui";
import { tokenService } from "@/core/auth/tokenService";
import * as DocumentPicker from "expo-document-picker";
import { uploadWorkspaceFile } from "@/core/api/uploadWorkspaceFile";
import { useTransferProgress } from "@/core/api/useTransferProgress";
import { describeUploadFailure } from "@/core/api/describeUploadFailure";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/core/query/queryKeys";
import { useToast } from "@/design-system/ui";
import { RootState } from "@/core/store";

import { WorkspaceTabBar, type WorkspaceTab } from "../components/WorkspaceTabBar";
import { WorkspaceStatusControl } from "../components/WorkspaceStatusControl";
import { workspaceStatus } from "../lib/status";
import { useUnread } from "@/modules/notification/hooks/useUnread";
import type { UnreadKind } from "@/modules/notification/api/types";

import { WorkspaceClientDetailsScreen } from "./WorkspaceClientDetailsScreen";
import { WorkspaceOverviewScreen } from "./WorkspaceOverviewScreen";
import { WorkspaceTasksScreen } from "@/modules/task/screens/WorkspaceTasksScreen";
import { WorkspaceChecklistsScreen } from "@/modules/checklist/screens/WorkspaceChecklistsScreen";
import { WorkspaceQuestionnairesScreen } from "@/modules/questionnaire/screens/WorkspaceQuestionnairesScreen";
import { WorkspaceFileRequestsScreen } from "@/modules/file-request/screens/WorkspaceFileRequestsScreen";
import { WorkspaceSignatureRequestsScreen } from "@/modules/signature-request/screens/WorkspaceSignatureRequestsScreen";
import { WorkspaceIRSSubmissionsScreen } from "@/modules/irs-submission/screens/WorkspaceIRSSubmissionsScreen";
import { WorkspaceMessageScreen } from "@/modules/message/screens/WorkspaceMessagesScreen";

/**
 * The workspace tabs, in the order they are worth reaching for.
 *
 * The bar scrolls horizontally, so anything past the third or fourth entry is
 * off screen and costs a swipe to find. Messages and client files are the two
 * things people come back to many times a day, so they lead. Details is kept
 * first because it is the landing tab. The reference material -- questionnaires,
 * signatures and IRS submissions -- is read rarely and sits at the far end.
 */
const TABS: WorkspaceTab[] = [
  { key: "details", label: "Details" },
  { key: "messages", label: "Messages" },
  { key: "client-files", label: "Client Files" },
  { key: "tasks", label: "Tasks" },
  { key: "checklists", label: "Checklists" },
  { key: "client-details", label: "Client Details" },
  { key: "questionnaires", label: "Questionnaires" },
  { key: "signatures", label: "Signatures" },
  { key: "irs-submissions", label: "IRS Submissions" },
];

/**
 * Which notification kinds feed each tab's badge.
 *
 * Kept apart from `TABS` because the two names genuinely differ -- the tab is
 * called "client-files" and the notifications are called "workspace_file" --
 * and pretending otherwise by renaming one to match would break either the
 * saved tab state or the server's type strings.
 *
 * Several kinds per tab, not one, because a tab is a place rather than a type.
 * Client Files shows the stored files *and* the requests for files, so counting
 * only one of them left every file request invisible here: the count reached
 * the workspace row and the header, where it could not be cleared from, so it
 * accumulated permanently and there was no way to find out what it referred to.
 *
 * Tabs absent from this map have nothing that arrives unseen, so they get no
 * badge rather than a permanent zero.
 */
const TAB_KINDS: Record<string, UnreadKind[]> = {
  messages: ["message"],
  "client-files": ["workspace_file", "file_request"],
  tasks: ["task"],
  checklists: ["checklist"],
  questionnaires: ["questionnaire"],
  signatures: ["signature_request"],
  "irs-submissions": ["irs_submission"],
};

/**
 * The workspace shell.
 *
 * Each tab renders its module inline. It previously rendered a card describing
 * the selected module with an "Open Tasks" button that navigated to the real
 * screen, which made this page a menu of menus: every module cost two taps and
 * a full navigation, and the intermediate screen showed nothing the tab label
 * had not already said.
 *
 * The layout is deliberately **not** wrapped in a ScrollView. Every module
 * screen brings its own, and nesting two vertically scrolling views makes both
 * behave erratically. Keeping the header and tab bar fixed also means the
 * module owns the entire remaining viewport, which is the point of the change:
 * the chrome above the content is now one compact row instead of a headline, a
 * details card and a section heading.
 */
export function WorkspaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("details");

  const { data: workspace, isLoading, isError, error, refetch } = useWorkspace(id);

  // Fetched here so the header can name the client without the Client Details
  // tab having to be open. The request is shared with that tab through the
  // query cache rather than issued twice.
  const { data: client } = useWorkspaceClientDetails(id);

  const user = useSelector((state: RootState) => state.auth.user);
  const token = tokenService.getAccessToken();

  const canEdit = user?.role === "admin";
  const { track } = useTransferProgress();
  const queryClient = useQueryClient();
  const toast = useToast();

  const clientName = client
    ? `${client.first_name} ${client.last_name}`.trim() || client.email
    : undefined;

  const unread = useUnread();

  const tabs = useMemo(
    () =>
      TABS.map((tab) => {
        const kinds = TAB_KINDS[tab.key];

        return kinds
          ? {
              ...tab,
              badge: kinds.reduce(
                (total, kind) => total + unread.forWorkspaceKind(id, kind),
                0,
              ),
            }
          : tab;
      }),
    [id, unread],
  );

  /**
   * Switching tabs only selects the tab.
   *
   * Clearing the badge used to happen here, which meant it happened only for
   * this screen: the same lists are also reached by deep link and by tapping a
   * notification, and by neither of those routes did the count go down. Each
   * module screen now clears what it shows, so reading the work counts however
   * the reader arrived -- and this is left with the one job its name implies.
   */
  const openTab = useCallback((key: string) => {
    setActiveTab(key);
  }, []);

  async function uploadHeaderFile() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ multiple: false });
      if (picked.canceled || !picked.assets.length) return;

      const asset = picked.assets[0];

      await track(asset.name, (onProgress) =>
        uploadWorkspaceFile(
          id,
          { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
          { onProgress },
        ),
      );

      await queryClient.invalidateQueries({ queryKey: ["workspace-files", id] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      toast.show("Workspace file uploaded", { tone: "success" });
    } catch (err) {
      toast.show(describeUploadFailure(err), { tone: "danger" });
    }
  }

  if (isLoading || isError) {
    return (
      <View className="flex-1 bg-background p-5 dark:bg-dark-background">
        <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />
      </View>
    );
  }

  if (!workspace) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-background">
        <Text className="text-text dark:text-dark-text">Workspace not found</Text>
      </View>
    );
  }

  function renderActiveTab() {
    if (!id || !workspace) return null;

    switch (activeTab) {
      case "details":
        return <WorkspaceOverviewScreen workspace={workspace} />;
      case "client-details":
        return <WorkspaceClientDetailsScreen />;
      case "tasks":
        return <WorkspaceTasksScreen workspaceId={id} />;
      case "checklists":
        return <WorkspaceChecklistsScreen workspaceId={id} />;
      case "client-files":
        return <WorkspaceFileRequestsScreen workspaceId={id} />;
      case "questionnaires":
        return <WorkspaceQuestionnairesScreen workspaceId={id} />;
      case "signatures":
        return <WorkspaceSignatureRequestsScreen workspaceId={id} />;
      case "irs-submissions":
        return <WorkspaceIRSSubmissionsScreen workspaceId={id} />;
      case "messages":
        // Messages needs an authenticated identity to attribute and stream
        // messages. Saying so beats rendering an empty thread, which would look
        // like a workspace with no conversation in it.
        if (!user || !token) {
          return (
            <View className="flex-1 items-center justify-center p-6">
              <Text className="text-center text-sm text-text-secondary dark:text-dark-text-secondary">
                Your session has expired. Sign in again to view messages.
              </Text>
            </View>
          );
        }
        return (
          <WorkspaceMessageScreen workspaceId={id} token={token} currentUserId={user.id} />
        );
      default:
        return null;
    }
  }

  return (
    <View className="flex-1 bg-background dark:bg-dark-background">
      {/* Compact identity strip. The workspace name is small and bold rather
          than a display heading: the user already chose this workspace, so the
          name confirms where they are, it is not the subject of the screen. */}
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-2.5 dark:border-dark-border dark:bg-dark-surface">
        <View className="flex-1 pr-3">
          <Text numberOfLines={1} className="text-sm font-bold text-text dark:text-dark-text">
            {workspace.name}
          </Text>

          {clientName ? (
            <Text
              numberOfLines={1}
              className="text-xs text-text-secondary dark:text-dark-text-secondary"
            >
              {clientName}
            </Text>
          ) : null}

          {/* The workspace identifier is the one most often quoted -- it is
              what a support request or a handover message is about, and it is
              the parent of every task, file and request underneath. */}
          <View className="mt-0.5 flex-row items-center gap-2">
            <CopyableId id={workspace.id} label="Workspace" />

            {/* Beside the identity rather than in the edit form. Status is
                read far more often than it is set, and burying it in a form
                would mean opening an editor to find out whether anyone is
                still working on this. */}
            <WorkspaceStatusControl
              workspaceId={workspace.id}
              status={workspaceStatus(workspace)}
              canEdit={canEdit}
            />
          </View>
        </View>

        {/* Only administrators may edit a workspace -- PATCH /workspaces/:id
            is behind RequireRole("admin"). Rendering the affordance for a
            client or manager would offer an action the API refuses, so the
            first they would learn of it is a 403 after filling in the form. */}
        {canEdit ? (
          <Pressable
            onPress={() => router.push(`/user/admin/workspaces/${id}/edit`)}
            accessibilityRole="button"
            accessibilityLabel="Edit workspace"
            hitSlop={8}
            className="rounded-full p-2"
          >
            <Icon as={Pencil} size="sm" />
          </Pressable>
        ) : null}
        {canEdit ? (
          <Pressable
            onPress={() => void uploadHeaderFile()}
            accessibilityRole="button"
            accessibilityLabel="Upload file to workspace"
            hitSlop={8}
            className="ml-2 rounded-full p-2"
          >
            <Icon as={ArrowUpFromLine} size="sm" />
          </Pressable>
        ) : null}
      </View>
      <WorkspaceTabBar tabs={tabs} activeKey={activeTab} onChange={openTab} />

      {/* The module owns everything below the tab bar. */}
      <View className="flex-1">{renderActiveTab()}</View>
    </View>
  );
}
