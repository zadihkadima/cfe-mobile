import React from "react";

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "@/design-system/theme/useTheme";

import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "expo-router";
import { useSelector } from "react-redux";
import { MoreVertical } from "lucide-react-native";

import { api } from "@/core/api/client";
import { useSeenWorkspaceWork } from "@/modules/notification/hooks/useSeenWorkspaceWork";
import {
  getWorkspaceFileAccess,
  getWorkspaceFileAccessUrl,
  reuploadWorkspaceFile,
  uploadWorkspaceFile,
} from "@/core/api/uploadWorkspaceFile";
import { queryKeys } from "@/core/query/queryKeys";
import { formatFileSize } from "@/core/format/formatFileSize";
import { QueryState } from "@/core/components/QueryState";
import { ActionMenu } from "@/core/components/ActionMenu";
import { describeUploadFailure } from "@/core/api/describeUploadFailure";
import { downloadAndOpenFile } from "@/core/api/downloadWorkspaceFile";
import { useTransferProgress } from "@/core/api/useTransferProgress";
import { TransferProgressBar } from "@/design-system/ui/feedback/TransferProgressBar";
import { useWorkspaceMembers } from "@/modules/workspace/hooks/useWorkspaceMembers";
import { memberDisplayName } from "@/modules/workspace/utils/memberDisplayName";

import { FileThumbnail } from "../components/FileThumbnail";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";
import { RootState } from "@/core/store";
import { Icon } from "@/design-system/ui";

type FileRequest = {
  id: string;
  title: string;
  description: string;
  status: string;

  /** Exchanged for a fresh download URL. Replaces the expiring file_url. */
  file_id?: string;

  /** Only present on requests answered before file_id existed. */
  file_url?: string;
  requested_from?: string;
  created_by?: string;
  created_by_name?: string;
};

type FileRequestListResponse = {
  items: FileRequest[];
  total: number;
};

type WorkspaceFile = {
  id: string;
  original_name: string;
  logical_name: string;
  version: number;
  is_latest: boolean;
  mime_type: string;
  size_bytes: number;
  download_count: number;
  description?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  created_at: string;
  access_url?: string;
  thumbnail_url?: string;
};

type WorkspaceFileListResponse = {
  items: WorkspaceFile[];
  total: number;
};

type ClientFilesTab = "files" | "requests";

export function WorkspaceFileRequestsScreen({ workspaceId, createRoute }: { workspaceId: string; createRoute?: string }) {
  const { theme } = useTheme();
  // Two kinds, because this screen is a place rather than a type: it shows the
  // stored files and the requests for files, so reading it means both. Only
  // the files were being cleared, which left every file request counted in the
  // header with nowhere to clear it from.
  useSeenWorkspaceWork(workspaceId, ["workspace_file", "file_request"]);

  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const members = useWorkspaceMembers(workspaceId);
  const [activeTab, setActiveTab] = React.useState<ClientFilesTab>("files");
  const [search, setSearch] = React.useState("");
  const [renameTarget, setRenameTarget] = React.useState<WorkspaceFile | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [descriptionValue, setDescriptionValue] = React.useState("");
  const [activeFileMenu, setActiveFileMenu] = React.useState<WorkspaceFile | null>(null);
  const fallbackCreateRoute = pathname?.includes("/user/admin/")
    ? `/user/admin/workspaces/${workspaceId}/client-files-create`
    : `/user/workspaces/${workspaceId}/client-files-create`;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.fileRequests.workspace(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<FileRequestListResponse>(`/workspaces/${workspaceId}/file-requests`);
      return data;
    },
  });

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: filesData } = useQuery({
    queryKey: ["workspace-files", workspaceId, debouncedSearch],
    queryFn: async () => {
      const { data } = await api.get<WorkspaceFileListResponse>(`/workspaces/${workspaceId}/files`, {
        params: {
          search: debouncedSearch.trim() || undefined,
        },
      });
      return data;
    },
  });

  const canManage = user?.role === "admin" || user?.role === "manager";

  const { transfer, track } = useTransferProgress();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const picked = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets.length) {
        return;
      }

      const asset = picked.assets[0];
      await track(asset.name, (onProgress) =>
        uploadWorkspaceFile(
          workspaceId,
          { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
          { onProgress },
        ),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace-files", workspaceId] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      Alert.alert("Success", "Workspace file uploaded.");
    },
  });

  const reuploadMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const picked = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets.length) {
        return;
      }

      const asset = picked.assets[0];
      await track(asset.name, (onProgress) =>
        reuploadWorkspaceFile(
          workspaceId,
          fileId,
          { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
          { onProgress },
        ),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace-files", workspaceId] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      Alert.alert("Success", "File updated successfully.");
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(`/workspaces/${workspaceId}/files/${fileId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace-files", workspaceId] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const renameFileMutation = useMutation({
    mutationFn: async ({ fileId, name, description }: { fileId: string; name: string; description: string }) => {
      await api.patch(`/workspaces/${workspaceId}/files/${fileId}`, { name, description });
    },
    onSuccess: async () => {
      setRenameTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["workspace-files", workspaceId] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      Alert.alert("Success", "File details updated.");
    },
    onError: () => Alert.alert("Could not update file", "Choose a unique, valid file name and try again."),
  });

  // Posts to the fulfil route rather than PATCHing the request. PATCH is
  // manager-only, so this -- the one action only a client can take -- was the
  // one action a client was refused. The upload succeeded first, so the file
  // was already stored when the 403 came back, and the request stayed
  // outstanding beside an orphaned file.
  const replyMutation = useMutation({
    mutationFn: async ({ requestId, fileId }: { requestId: string; fileId: string }) => {
      await api.post(
        `/workspaces/${workspaceId}/file-requests/${requestId}/fulfil`,
        { file_id: fileId },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.fileRequests.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: ["workspace-files", workspaceId] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const openDownload = async (fileId: string, fileName: string) => {
    const url = await getWorkspaceFileAccessUrl(workspaceId, fileId);
    await track(fileName, (onProgress) => downloadAndOpenFile(url, fileName, onProgress), "Downloading");
  };

  const copySecureLink = async (fileId: string) => {
    try {
      const access = await getWorkspaceFileAccess(workspaceId, fileId);
      await Clipboard.setStringAsync(access.url);

      const expiresAt = new Date(access.expiresAt);
      const remainingMinutes = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 60_000));
      const expiryTime = expiresAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

      Alert.alert(
        "Secure link copied",
        `This link will work for ${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}, until ${expiryTime}.`,
      );
    } catch {
      Alert.alert("Could not copy secure link", "Please try again.");
    }
  };

  /**
   * Opens the file that answered a request.
   *
   * Prefers the id, fetching a fresh URL at the moment of opening. Requests
   * answered before file_id existed only have the URL that was current when
   * they were answered, which expired ten minutes later -- so those are still
   * tried, but they are the reason this fell back to a dead link at all.
   */
  const openRequestFile = async (item: FileRequest) => {
    try {
      if (item.file_id) {
        const url = await getWorkspaceFileAccessUrl(workspaceId, item.file_id);
        await track(item.title, (onProgress) => downloadAndOpenFile(url, item.title, onProgress), "Downloading");
        return;
      }

      if (item.file_url) {
        await Linking.openURL(item.file_url);
        return;
      }
    } catch {
      Alert.alert(
        "Could not open the file",
        "The link may have expired. Ask for the file to be sent again.",
      );
    }
  };

  const uploadReplyToRequest = async (requestId: string) => {
    const picked = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets.length) {
      return;
    }

    const asset = picked.assets[0];

    // Wrapped so a failure is reported. Previously this was an unhandled async
    // function passed straight to onPress, so the rejection went nowhere: the
    // client saw no confirmation, no error, and a request still marked
    // outstanding, with no way to tell whether to try again.
    try {
      const uploadedFile = await track(asset.name, (onProgress) =>
        uploadWorkspaceFile(
          workspaceId,
          { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
          { onProgress },
        ),
      );

      // The id, not an access URL. The URL expires in ten minutes, so storing
      // it meant a reply opened the next morning was a dead link.
      await replyMutation.mutateAsync({ requestId, fileId: uploadedFile.id });

      Alert.alert("Sent", "Your file has been attached to the request.");
    } catch (error) {
      Alert.alert("Could not send", describeUploadFailure(error));
    }
  };

  const showHistory = async (fileId: string) => {
    const { data } = await api.get<{
      versions: WorkspaceFile[];
      downloads: { id: string; downloaded_by: string; created_at: string }[];
    }>(`/workspaces/${workspaceId}/files/${fileId}/history`);

    const versionsText = data.versions
      .map((v) => `v${v.version} · ${v.original_name} · ${new Date(v.created_at).toLocaleString()}`)
      .join("\n");

    const downloadsText = data.downloads
      .slice(0, 5)
      .map((d) => `${d.downloaded_by} · ${new Date(d.created_at).toLocaleString()}`)
      .join("\n");

    Alert.alert("File History", `${versionsText || "No versions"}\n\nDownloads:\n${downloadsText || "No downloads"}`);
  };

  const markUploadedMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/workspaces/${workspaceId}/file-requests/${id}`, {
        status: "uploaded",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.fileRequests.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-background"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <View className="p-4">
        <Modal
          visible={!!renameTarget}
          transparent
          animationType="fade"
          onRequestClose={() => setRenameTarget(null)}
        >
          <View className="flex-1 items-center justify-center bg-black/40 px-6">
            <View className="w-full rounded-xl bg-surface p-5 dark:bg-dark-surface">
              <Text className="text-lg font-bold text-text dark:text-dark-text">File details</Text>
              <TextInput
                className="mt-4 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
                value={renameValue}
                onChangeText={setRenameValue}
                autoFocus
                autoCapitalize="none"
                accessibilityLabel="New file name"
              />
              <TextInput
                className="mt-3 min-h-20 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
                value={descriptionValue}
                onChangeText={setDescriptionValue}
                placeholder="Optional description"
                placeholderTextColor={theme.colors.textMuted}
                multiline
                accessibilityLabel="File description"
              />
              <View className="mt-4 flex-row justify-end gap-2">
                <Pressable className="rounded-md border border-border px-3 py-2 dark:border-dark-border" onPress={() => setRenameTarget(null)}>
                  <Text className="font-semibold text-text dark:text-dark-text">Cancel</Text>
                </Pressable>
                <Pressable
                  className="rounded-md bg-primary px-3 py-2"
                  onPress={() => renameTarget && renameFileMutation.mutate({ fileId: renameTarget.id, name: renameValue, description: descriptionValue })}
                  disabled={!renameValue.trim() || renameFileMutation.isPending}
                >
                  <Text className="font-semibold text-white dark:text-dark-text-inverted">{renameFileMutation.isPending ? "Saving…" : "Save"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        {/*
          Above the content rather than beside the button that started it. The
          same bar serves uploads, reuploads and replies, and anchoring it to
          one of the three would leave the other two silent.
        */}
        {transfer && (
          <TransferProgressBar
            name={transfer.name}
            progress={transfer.progress}
            verb={transfer.verb}
          />
        )}

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text dark:text-dark-text">Documents</Text>
          {activeTab === "requests" && canManage ? (
            <Pressable
              className="rounded-lg border border-primary px-3 py-2"
              onPress={() => router.push(createRoute ?? fallbackCreateRoute)}
            >
              <Text className="font-semibold text-primary">Create request</Text>
            </Pressable>
          ) : null}
          {activeTab === "files" ? (
            <Pressable
              className="rounded-lg border border-secondary px-3 py-2"
              onPress={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending}
            >
              <Text className="font-semibold text-secondary">Upload shared file</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="mb-4 flex-row rounded-lg bg-muted p-1 dark:bg-dark-muted" accessibilityRole="tablist">
          <Pressable
            className={`flex-1 rounded-md px-3 py-2 ${activeTab === "files" ? "bg-surface dark:bg-dark-surface" : ""}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "files" }}
            onPress={() => setActiveTab("files")}
          >
            <Text className={`text-center font-semibold ${activeTab === "files" ? "text-text dark:text-dark-text" : "text-text-secondary dark:text-dark-text-secondary"}`}>Shared files</Text>
          </Pressable>
          <Pressable
            className={`flex-1 rounded-md px-3 py-2 ${activeTab === "requests" ? "bg-surface dark:bg-dark-surface" : ""}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "requests" }}
            onPress={() => setActiveTab("requests")}
          >
            <Text className={`text-center font-semibold ${activeTab === "requests" ? "text-text dark:text-dark-text" : "text-text-secondary dark:text-dark-text-secondary"}`}>File requests</Text>
          </Pressable>
        </View>

        {activeTab === "files" ? (
          <>
            <TextInput
              className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
              placeholder="Search latest file by name"
              placeholderTextColor={theme.colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {(filesData?.items ?? []).map((file) => (
              <View
                key={file.id}
                className="mb-2 rounded-xl border border-border bg-surface p-3 dark:border-dark-border dark:bg-dark-surface"
              >
                <View className="flex-row items-center">
                  <FileThumbnail
                    mimeType={file.mime_type}
                    originalName={file.original_name}
                    thumbnailUrl={file.thumbnail_url}
                  />

                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-text dark:text-dark-text">{file.original_name}</Text>
                    <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                      v{file.version} · {file.mime_type} · {formatFileSize(file.size_bytes)}
                    </Text>
                    <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                      Downloads: {file.download_count}
                    </Text>
                    {!!file.description && (
                      <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">{file.description}</Text>
                    )}
                    <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                      Uploaded by: {file.uploaded_by_name ?? memberDisplayName(members.data?.items ?? [], file.uploaded_by)}
                    </Text>
                  </View>
                  <Pressable
                    className="rounded-full p-2"
                    accessibilityRole="button"
                    accessibilityLabel={`Actions for ${file.original_name}`}
                    onPress={() => setActiveFileMenu(file)}
                  >
                    <Icon as={MoreVertical} size="md" tone="secondary" />
                  </Pressable>
                </View>

                <Pressable
                  className="mt-3 items-center rounded-lg border border-primary px-3 py-2 dark:border-dark-primary"
                  onPress={() => void openDownload(file.id, file.original_name)}
                >
                  <Text className="font-semibold text-primary dark:text-dark-primary">Open file</Text>
                </Pressable>
              </View>
            ))}
            {!filesData?.items.length && (
              <Text className="mb-4 text-text-secondary dark:text-dark-text-secondary">No files uploaded yet.</Text>
            )}
          </>
        ) : (
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            isEmpty={!data?.items.length}
            emptyMessage="No file requests yet."
            onRetry={refetch}
          >
          {(data?.items ?? []).map((item) => (
            <View
              key={item.id}
              className="mb-3 rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface"
            >
              <Text className="text-base font-bold text-text dark:text-dark-text">{item.title}</Text>
              {!!item.description && (
                <Text className="mt-1 text-text-secondary dark:text-dark-text-secondary">{item.description}</Text>
              )}
              <Text className="mt-2 text-xs text-text-secondary dark:text-dark-text-secondary">
                Status: {item.status}
              </Text>
              {!!item.created_by && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Requested by: {memberDisplayName(members.data?.items ?? [], item.created_by, item.created_by_name)}
                </Text>
              )}
              {!!item.requested_from && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Requested from: {memberDisplayName(members.data?.items ?? [], item.requested_from)}
                </Text>
              )}

              {(!!item.file_id || !!item.file_url) && (
                <Pressable className="mt-3 rounded-lg border border-primary px-3 py-2" onPress={() => void openRequestFile(item)}>
                  <Text className="font-semibold text-primary">Open attached reply</Text>
                </Pressable>
              )}

              {!canManage && item.status !== "uploaded" && (
                <Pressable
                  className="mt-3 items-center rounded-lg border border-secondary px-3 py-2"
                  onPress={() => void uploadReplyToRequest(item.id)}
                  disabled={replyMutation.isPending}
                >
                  <Text className="font-semibold text-secondary">Reply with file</Text>
                </Pressable>
              )}

              {canManage && item.status !== "uploaded" && (
                <Pressable
                  className="mt-3 items-center rounded-lg border border-primary px-3 py-2"
                  onPress={() => markUploadedMutation.mutate(item.id)}
                >
                  <Text className="font-semibold text-primary">Mark uploaded</Text>
                </Pressable>
              )}
            </View>
          ))}
          </QueryState>
        )}

        <ActionMenu
          visible={!!activeFileMenu}
          title={activeFileMenu?.original_name}
          onClose={() => setActiveFileMenu(null)}
          actions={activeFileMenu ? [
            { label: "Copy secure link", onPress: () => void copySecureLink(activeFileMenu.id) },
            { label: "Upload a new version", onPress: () => reuploadMutation.mutate(activeFileMenu.id) },
            { label: "Edit file details", onPress: () => { setRenameTarget(activeFileMenu); setRenameValue(activeFileMenu.original_name); setDescriptionValue(activeFileMenu.description ?? ""); } },
            { label: "View history", onPress: () => void showHistory(activeFileMenu.id) },
            { label: "Delete file", destructive: true, onPress: () => deleteFileMutation.mutate(activeFileMenu.id) },
          ] : []}
        />

      </View>
    </ScrollView>
  );
}
