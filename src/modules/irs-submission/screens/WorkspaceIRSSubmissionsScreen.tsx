import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "expo-router";
import { useSelector } from "react-redux";

import { api } from "@/core/api/client";
import { useSeenWorkspaceWork } from "@/modules/notification/hooks/useSeenWorkspaceWork";
import { uploadWorkspaceFile } from "@/core/api/uploadWorkspaceFile";
import { useTransferProgress } from "@/core/api/useTransferProgress";
import { TransferProgressBar } from "@/design-system/ui/feedback/TransferProgressBar";
import { queryKeys } from "@/core/query/queryKeys";
import { QueryState } from "@/core/components/QueryState";
import { RootState } from "@/core/store";

type IRSSubmission = {
  id: string;
  title: string;
  description: string;
  tax_year: number;
  status: string;
  requested_from?: string;
  submission_file_id?: string;
  submitted_at?: string;
  submitted_by?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  due_at?: string;
};

type IRSSubmissionListResponse = {
  items: IRSSubmission[];
  total: number;
};

export function WorkspaceIRSSubmissionsScreen({ workspaceId }: { workspaceId: string }) {
  // Cleared here rather than by whatever opened the screen, because a tab, a
  // deep link and a tapped notification all arrive at this same list.
  useSeenWorkspaceWork(workspaceId, ["irs_submission"]);

  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);

  const { transfer, track } = useTransferProgress();
  const irsQueryKey = ["irs-submissions", workspaceId] as const;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: irsQueryKey,
    queryFn: async () => {
      const { data } = await api.get<IRSSubmissionListResponse>(`/workspaces/${workspaceId}/irs-submissions`);
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ id, submissionFileId }: { id: string; submissionFileId: string }) => {
      await api.patch(`/workspaces/${workspaceId}/irs-submissions/${id}`, {
        status: "submitted",
        submission_file_id: submissionFileId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: irsQueryKey });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/workspaces/${workspaceId}/irs-submissions/${id}`, {
        status: "approved",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: irsQueryKey });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/workspaces/${workspaceId}/irs-submissions/${id}`, {
        status: "rejected",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: irsQueryKey });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workspaces/${workspaceId}/irs-submissions/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: irsQueryKey });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const canManage = user?.role === "admin" || user?.role === "manager";
  const currentUserId = user?.id ?? "";
  const createRoute = pathname?.includes("/user/admin/")
    ? `/user/admin/workspaces/${workspaceId}/irs-submissions-create`
    : `/user/workspaces/${workspaceId}/irs-submissions-create`;

  const uploadSubmissionFile = async (itemId: string) => {
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

      await submitMutation.mutateAsync({
        id: itemId,
        submissionFileId: uploadedFile.id,
      });

      Alert.alert("Success", "IRS submission file attached.");
    } catch (_error) {
      Alert.alert("Upload failed", "Unable to upload IRS submission file. Please try again.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-background"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <View className="p-4">
        {transfer && (
          <TransferProgressBar name={transfer.name} progress={transfer.progress} />
        )}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text dark:text-dark-text">IRS Submissions</Text>
          {canManage ? (
            <Pressable
              className="rounded-lg border border-primary px-3 py-2"
              onPress={() => router.push(createRoute)}
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
          emptyMessage="No IRS submissions yet."
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
                Tax Year: {item.tax_year}
              </Text>
              <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                Status: {item.status}
              </Text>
              {!!item.requested_from && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Requested from: {item.requested_from.slice(0, 8)}
                </Text>
              )}
              {!!item.due_at && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">Due: {item.due_at}</Text>
              )}
              {!!item.submitted_at && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Submitted: {item.submitted_at}
                </Text>
              )}
              {!!item.reviewed_at && (
                <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  Reviewed: {item.reviewed_at}
                </Text>
              )}

              {item.requested_from === currentUserId && item.status !== "submitted" && item.status !== "approved" && (
                <Pressable
                  className="mt-3 items-center rounded-lg border border-secondary px-3 py-2"
                  onPress={() => void uploadSubmissionFile(item.id)}
                  disabled={submitMutation.isPending}
                >
                  <Text className="font-semibold text-secondary">Upload IRS file</Text>
                </Pressable>
              )}

              {canManage && item.status === "submitted" && (
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    className="flex-1 items-center rounded-lg border border-primary px-3 py-2"
                    onPress={() => approveMutation.mutate(item.id)}
                  >
                    <Text className="font-semibold text-primary">Approve</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 items-center rounded-lg border border-danger px-3 py-2"
                    onPress={() => rejectMutation.mutate(item.id)}
                  >
                    <Text className="font-semibold text-danger">Reject</Text>
                  </Pressable>
                </View>
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
