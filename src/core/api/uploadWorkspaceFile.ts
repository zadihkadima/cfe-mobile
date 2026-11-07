import { Platform } from "react-native";

import { api } from "./client";

export type WorkspaceFileUploadResult = {
  id: string;
  workspace_id: string;
  original_name: string;
  logical_name: string;
  version: number;
  is_latest: boolean;
  mime_type: string;
  size_bytes: number;
  download_count: number;
  uploaded_by: string;
  uploaded_by_name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  access_url?: string;
  access_expires_at?: string;
};

type UploadAsset = {
  uri: string;
  name: string;
  mimeType?: string | null;
};

/**
 * Fraction uploaded, 0 to 1, or null when it cannot be known.
 *
 * Null is not zero. Some platforms do not report the total size of a multipart
 * body, and a bar pinned at 0% for the whole upload reads as a transfer that
 * never started -- which is when people press cancel on something that was
 * working. A caller seeing null should show indeterminate progress instead.
 */
export type UploadProgress = number | null;

export type UploadOptions = {
  onProgress?: (progress: UploadProgress) => void;
  description?: string;
};

function progressHandler(onProgress?: (progress: UploadProgress) => void) {
  if (!onProgress) return undefined;

  return (event: { loaded: number; total?: number }) => {
    // total is optional in axios' typing and genuinely absent on some
    // platforms, so it is checked rather than trusted.
    if (!event.total) {
      onProgress(null);
      return;
    }

    // Capped below 1. The last byte leaving the device is not the same as the
    // server having accepted the file: scanning and storage still follow. A
    // bar that sits at 100% while the request is outstanding makes that wait
    // look like a hang.
    onProgress(Math.min(0.99, event.loaded / event.total));
  };
}

/**
 * Builds the multipart body for one asset.
 *
 * The two platforms need genuinely different things here, and the difference
 * is not a preference -- getting it wrong produces a request that succeeds
 * with an empty file rather than one that fails.
 *
 * On a device, React Native's FormData is a polyfill, not the browser API. Its
 * `append` takes two arguments and silently discards a third, and `getParts`
 * serialises a value by spreading it and looking for a `uri` key. So it wants
 * `{uri, name, type}` and nothing else will do. Handing it a Blob -- as this
 * did -- spreads to `{_data}`, because `size` and `type` are prototype getters
 * rather than own properties, leaving a part with no uri, no content and,
 * since a Blob has no `name`, no filename in its content-disposition either.
 * The upload then completed with a 200 and stored nothing, which is why this
 * looked like every screen breaking at once rather than like an error.
 *
 * On web, FormData is the real thing and the opposite holds: it has no notion
 * of a uri, so the bytes have to be fetched and appended as a Blob, where the
 * third argument is honoured and supplies the filename.
 */
async function buildUploadFormData(asset: UploadAsset, description?: string): Promise<FormData> {
  const formData = new FormData();
  const mimeType = asset.mimeType ?? "application/octet-stream";

  if (Platform.OS === "web") {
    const response = await fetch(asset.uri);

    if (!response.ok) {
      throw new Error(
        `Could not read the selected file (${response.status}).`,
      );
    }

    formData.append("file", await response.blob(), asset.name);
    if (description !== undefined) formData.append("description", description);

    return formData;
  }

  // Cast because the polyfill's own typing describes the browser API it is
  // standing in for, not the shape it actually consumes.
  formData.append("file", {
    uri: asset.uri,
    name: asset.name,
    type: mimeType,
  } as unknown as Blob);
  if (description !== undefined) formData.append("description", description);

  return formData;
}

export async function uploadWorkspaceFile(
  workspaceId: string,
  asset: UploadAsset,
  options: UploadOptions = {},
): Promise<WorkspaceFileUploadResult> {
  const formData = await buildUploadFormData(asset, options.description);

  const response = await api.post<WorkspaceFileUploadResult>(
    `/workspaces/${workspaceId}/files/upload`,
    formData,
    { onUploadProgress: progressHandler(options.onProgress) },
  );

  return response.data;
}

export async function reuploadWorkspaceFile(
  workspaceId: string,
  fileId: string,
  asset: UploadAsset,
  options: UploadOptions = {},
): Promise<WorkspaceFileUploadResult> {
  const formData = await buildUploadFormData(asset, options.description);

  const response = await api.post<WorkspaceFileUploadResult>(
    `/workspaces/${workspaceId}/files/${fileId}/reupload`,
    formData,
    { onUploadProgress: progressHandler(options.onProgress) },
  );

  return response.data;
}

export type WorkspaceFileAccess = {
  url: string;

  /** RFC3339. The URL stops working at this moment, not a moment later. */
  expiresAt: string;
};

/**
 * Asks for a short-lived URL to a stored file.
 *
 * The URL expires deliberately, so it is fetched at the moment of use and
 * never stored. A link that keeps working is a link that keeps working after
 * it has been forwarded, screenshotted, or left in a log.
 *
 * The expiry comes back with it rather than being assumed here. Guessing the
 * lifetime client-side means every change to it on the server silently breaks
 * the moment the two disagree.
 */
export async function getWorkspaceFileAccess(
  workspaceId: string,
  fileId: string,
): Promise<WorkspaceFileAccess> {
  const response = await api.get<{ url: string; expires_at: string }>(
    `/workspaces/${workspaceId}/files/${fileId}/access-url`,
  );

  return { url: response.data.url, expiresAt: response.data.expires_at };
}

export async function getWorkspaceFileAccessUrl(workspaceId: string, fileId: string) {
  const access = await getWorkspaceFileAccess(workspaceId, fileId);

  return access.url;
}
