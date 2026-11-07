import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "expo-router";
import { useSelector } from "react-redux";

import { api } from "@/core/api/client";
import { useSeenWorkspaceWork } from "@/modules/notification/hooks/useSeenWorkspaceWork";
import { describeUploadFailure } from "@/core/api/describeUploadFailure";
import { uploadWorkspaceFile, getWorkspaceFileAccessUrl } from "@/core/api/uploadWorkspaceFile";
import { useTransferProgress } from "@/core/api/useTransferProgress";import { downloadAndOpenFile } from '@/core/api/downloadWorkspaceFile';import { TransferProgressBar } from "@/design-system/ui/feedback/TransferProgressBar";
import { queryKeys } from "@/core/query/queryKeys";
import { QueryState } from "@/core/components/QueryState";
import { RootState } from "@/core/store";
import { useWorkspaceMembers } from "@/modules/workspace/hooks/useWorkspaceMembers";
import { memberDisplayName } from "@/modules/workspace/utils/memberDisplayName";

type WorkspaceFileSummary = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
};

type SignatureRequest = {
  id: string;
  document_name: string;
  description: string;
  status: string;
  document_file_id: string;
  document_file?: WorkspaceFileSummary;
  signed_file_id?: string;
  signed_file?: WorkspaceFileSummary;
  signed_at?: string;
  signed_by?: string;
  completed_at?: string;
  due_at?: string;
  requested_from?: string;
  created_by?: string;
  created_by_name?: string;
};

type SignatureRequestListResponse = {
  items: SignatureRequest[];
  total: number;
};

export function WorkspaceSignatureRequestsScreen({ workspaceId }: { workspaceId: string }) {
  // Covers the replies as well as the requests: a signed document arrives as
  // signature_request.file_uploaded, so it is the same kind and the same list.
  useSeenWorkspaceWork(workspaceId, ["signature_request"]);

  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const members = useWorkspaceMembers(workspaceId);

  // Which request's signed file is on its way, so the button for that one row
  // can say so. A screen-wide boolean would disable every request's button,
  // which reads as the screen having frozen.
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  // uploadingFor says *which* row is busy; this says *how far along* it is.
  // Neither answers the other's question, so both are kept.
  const { transfer, track } = useTransferProgress();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.signatureRequests.workspace(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<SignatureRequestListResponse>(`/workspaces/${workspaceId}/signature-requests`);
      return data;
    },
  });

  const markSignedMutation = useMutation({
    mutationFn: async ({ id, signedFileId }: { id: string; signedFileId: string }) => {
      await api.patch(`/workspaces/${workspaceId}/signature-requests/${id}`, {
        status: "signed",
        signed_file_id: signedFileId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.signatureRequests.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/workspaces/${workspaceId}/signature-requests/${id}`, {
        status: "completed",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.signatureRequests.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workspaces/${workspaceId}/signature-requests/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.signatureRequests.workspace(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const canManage = user?.role === "admin" || user?.role === "manager";  const currentUserId = user?.id ?? "";
  const fallbackCreateRoute = pathname?.includes("/user/admin/")
    ? `/user/admin/workspaces/${workspaceId}/signatures-create`
    : `/user/workspaces/${workspaceId}/signatures-create`;

  const uploadSignedFile = async (itemId: string) => {
    const picked = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (picked.canceled || !picked.assets.length) {
      return;
    }

    const asset = picked.assets[0];
    setUploadingFor(itemId);

    try {
      const uploadedFile = await track(asset.name, (onProgress) =>
        uploadWorkspaceFile(
          workspaceId,
          { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
          { onProgress },
        ),
      );

      await markSignedMutation.mutateAsync({
        id: itemId,
        signedFileId: uploadedFile.id,
      });

      Alert.alert("Success", "Signed file attached and request updated.");
    } catch (error) {
      // "Please try again" is wrong advice for most of the ways this fails:
      // a file over the limit and a file the scanner refused will both fail
      // again identically. The server says which it was, so say it.
      Alert.alert("Upload failed", describeUploadFailure(error));
    } finally {
      setUploadingFor(null);
    }
  };

  const openWorkspaceFile = async (fileId: string, fileName = "Document") => {
    try {
      const url = await getWorkspaceFileAccessUrl(workspaceId, fileId);
      await track(fileName, (onProgress) => downloadAndOpenFile(url, fileName, onProgress), "Downloading");
    } catch (_error) {
      Alert.alert("Unable to open file", "Please try again.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-background"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      {transfer ? <TransferProgressBar name={transfer.name} progress={transfer.progress} verb={transfer.verb} /> : null}
      <View className="p-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text dark:text-dark-text">Signature Requests</Text>
          {canManage ? (
            <Pressable
              className="rounded-lg border border-primary px-3 py-2"
              onPress={() => router.push(fallbackCreateRoute)}
            >
              <Text className="font-semibold text-primary">Create</Text>
            </Pressable>
          ) : null}
        </View>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!data?.items.length}
          emptyMessage="No signature requests yet."
          onRetry={refetch}
        >
          {(data?.items ?? []).map((item) => (
            <View
              key={item.id}
              className="mb-3 rounded-xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface"
            >
              <Text className="text-base font-bold text-text dark:text-dark-text">{item.document_name}</Text>
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
              {!!item.document_file && (
                <>
                  <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                    Document: {item.document_file.original_name}
                  </Text>
                  <Pressable
                    className="mt-2 rounded-lg border border-primary px-3 py-2"
                    onPress={() => void openWorkspaceFile(item.document_file_id)}
                  >
                    <Text className="font-semibold text-primary">Open document</Text>
                  </Pressable>
                </>
              )}
              {!!item.requested_from && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Requested from: {memberDisplayName(members.data?.items ?? [], item.requested_from)}
                </Text>
              )}
              {!!item.due_at && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">Due: {item.due_at}</Text>
              )}
              {!!item.signed_file && (
                <>
                  <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                    Signed file: {item.signed_file.original_name}
                  </Text>
                  {!!item.signed_file_id && (
                    <Pressable
                      className="mt-2 rounded-lg border border-secondary px-3 py-2"
                      onPress={() => void openWorkspaceFile(item.signed_file_id!)}
                    >
                      <Text className="font-semibold text-secondary">Open signed file</Text>
                    </Pressable>
                  )}
                </>
              )}
              {!!item.signed_at && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Signed: {item.signed_at}
                </Text>
              )}
              {!!item.completed_at && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Completed: {item.completed_at}
                </Text>
              )}

              {item.requested_from === currentUserId && item.status !== "signed" && item.status !== "completed" && (
                <Pressable
                  className="mt-3 items-center rounded-lg border border-secondary px-3 py-2"
                  onPress={() => void uploadSignedFile(item.id)}
                  // The upload itself was previously unguarded: the mutation
                  // only becomes pending once the file has finished arriving,
                  // so during a large transfer the button stayed live and
                  // every extra tap started another upload. The duplicates
                  // were kept, since each one is a real file.
                  disabled={uploadingFor !== null || markSignedMutation.isPending}
                >
                  <Text className="font-semibold text-secondary">
                    {uploadingFor === item.id ? "Uploading\u2026" : "Upload signed file"}
                  </Text>
                </Pressable>
              )}

              {canManage && item.status === "signed" && (
                <Pressable
                  className="mt-3 items-center rounded-lg border border-primary px-3 py-2"
                  onPress={() => markCompletedMutation.mutate(item.id)}
                >
                  <Text className="font-semibold text-primary">Mark completed</Text>
                </Pressable>
              )}

              {canManage && (
                <Pressable
                  className="mt-2 items-center rounded-lg border border-danger px-3 py-2"
                  onPress={() => deleteMutation.mutate(item.id)}
                >
                  <Text className="font-semibold text-danger">Delete</Text>
                </Pressable>
              )}
            </View>
          ))}
        </QueryState>

      </View>
    </ScrollView>
  );
}
