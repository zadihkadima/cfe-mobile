import { useState } from "react";

import { Alert, Pressable, Text, TextInput } from "react-native";
import { useTheme } from "@/design-system/theme/useTheme";

import * as DocumentPicker from "expo-document-picker";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { api } from "@/core/api/client";
import { uploadWorkspaceFile } from "@/core/api/uploadWorkspaceFile";
import { describeUploadFailure } from "@/core/api/describeUploadFailure";
import { useTransferProgress } from "@/core/api/useTransferProgress";
import { TransferProgressBar } from "@/design-system/ui/feedback/TransferProgressBar";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";
import { queryKeys } from "@/core/query/queryKeys";

type WorkspaceFile = {
  id: string;
  original_name: string;
};

type WorkspaceFileListResponse = {
  items: WorkspaceFile[];
  total: number;
};

export function CreateWorkspaceSignatureRequestScreen({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const [documentFileId, setDocumentFileId] = useState("");
  const [requestedFrom, setRequestedFrom] = useState("");
  const [dueAt, setDueAt] = useState("");

  const { transfer, track } = useTransferProgress();

  const uploadDocumentFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (picked.canceled || !picked.assets.length) {
      return;
    }

    const asset = picked.assets[0];

    try {
      const uploadedFile = await track(asset.name, (onProgress) =>
        uploadWorkspaceFile(
          workspaceId,
          { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
          { onProgress },
        ),
      );

      setDocumentFileId(uploadedFile.id);
      Alert.alert("Uploaded", `${asset.name} is attached to this request.`);
    } catch (error) {
      // The server distinguishes a file that is too large from one a scan
      // rejected, and repeating "please try again" for both sends someone to
      // retry an upload that will be refused every time.
      Alert.alert("Upload failed", describeUploadFailure(error));
    }
  };

  const { data: files } = useQuery({
    queryKey: ["workspace-files", workspaceId],
    queryFn: async () => {
      const { data } = await api.get<WorkspaceFileListResponse>(`/workspaces/${workspaceId}/files`);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/workspaces/${workspaceId}/signature-requests`, {
        document_name: documentName,
        description,
        document_file_id: documentFileId,
        requested_from: requestedFrom.trim() || undefined,
        due_at: dueAt.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.signatureRequests.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      router.back();
    },
  });

  return (
    <ScreenScrollView>
      <Text className="mb-4 text-2xl font-bold text-text dark:text-dark-text">Create Signature Request</Text>

      {transfer && (
        <TransferProgressBar name={transfer.name} progress={transfer.progress} />
      )}

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Document name"
        placeholderTextColor={theme.colors.textMuted}
        value={documentName}
        onChangeText={setDocumentName}
      />

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Description"
        placeholderTextColor={theme.colors.textMuted}
        value={description}
        onChangeText={setDescription}
      />

      <Text className="mb-2 text-sm font-semibold text-text dark:text-dark-text">Workspace file ID</Text>
      <TextInput
        className="mb-2 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Paste file ID"
        placeholderTextColor={theme.colors.textMuted}
        value={documentFileId}
        onChangeText={setDocumentFileId}
      />

      <Pressable
        className="mb-3 items-center rounded-lg border border-secondary px-3 py-2"
        onPress={() => void uploadDocumentFile()}
      >
        <Text className="font-semibold text-secondary">Upload document file</Text>
      </Pressable>

      {!!files?.items.length && (
        <Text className="mb-4 text-xs text-text-secondary dark:text-dark-text-secondary">
          Available file IDs: {files.items.map((file) => file.id).join(", ")}
        </Text>
      )}

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Requested from user ID (optional)"
        placeholderTextColor={theme.colors.textMuted}
        value={requestedFrom}
        onChangeText={setRequestedFrom}
      />

      <TextInput
        className="mb-3 rounded-lg border border-border px-3 py-2 text-text dark:border-dark-border dark:text-dark-text"
        placeholder="Due at (RFC3339, optional)"
        placeholderTextColor={theme.colors.textMuted}
        value={dueAt}
        onChangeText={setDueAt}
      />

      <Pressable
        className="items-center rounded-lg bg-text px-3 py-3 dark:bg-dark-text"
        onPress={() => createMutation.mutate()}
        disabled={!documentName.trim() || !documentFileId.trim() || createMutation.isPending}
      >
        <Text className="font-semibold text-background dark:text-dark-background">Save request</Text>
      </Pressable>
    </ScreenScrollView>
  );
}
