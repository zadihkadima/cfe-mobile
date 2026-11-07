import { Directory, DownloadTask, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

import type { UploadProgress } from './uploadWorkspaceFile';

/**
 * Progress reported while a file comes down. Shares the shape used for uploads
 * so a single bar component can render either: a fraction in 0..1, or `null`
 * when the size is unknown and only motion can be shown.
 */
export type DownloadProgressHandler = (progress: UploadProgress) => void;

/**
 * A download's destination has to be unique. Two attachments in the same
 * workspace can genuinely share a filename, and the second download would
 * otherwise overwrite a file the user is still reading from the first.
 */
function scratchDirectory(): Directory {
  const dir = new Directory(Paths.cache, `downloads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/**
 * Filenames reach the filesystem verbatim, and they arrive from whoever
 * uploaded them. A name containing a path separator would place the file
 * somewhere other than the directory we just made; `..` would climb out of the
 * cache entirely. Neither is worth supporting, so both are flattened.
 */
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[/\\]/g, '_').replace(/^\.+/, '').trim();
  return cleaned.length > 0 ? cleaned.slice(0, 120) : 'download';
}

/**
 * Fetches a file through the app so its progress is observable, then hands it
 * to the system share sheet.
 *
 * The alternative — handing the URL to `Linking.openURL` — makes the OS browser
 * responsible for the transfer. That works, but the app never sees a byte of
 * it, so there is nothing to draw a progress bar from. Fetching here is what
 * buys the progress.
 */
export async function downloadAndOpenFile(
  url: string,
  fileName: string,
  onProgress?: DownloadProgressHandler,
): Promise<void> {
  // The share sheet is the only way to hand the user a downloaded file. Without
  // it the download would land in a cache directory they cannot browse to,
  // which is worse than the browser hand-off it replaced.
  if (!(await Sharing.isAvailableAsync())) {
    await Linking.openURL(url);
    return;
  }

  const destination = new File(scratchDirectory(), safeFileName(fileName));
  const task = new DownloadTask(url, destination, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      // The server omits Content-Length for streamed responses and the module
      // reports -1. Reporting 0 there would look like a stalled download rather
      // than an unmeasurable one, so the size stays explicitly unknown.
      if (!onProgress) return;
      if (totalBytes <= 0) {
        onProgress(null);
        return;
      }
      onProgress(Math.min(bytesWritten / totalBytes, 1));
    },
  });

  const downloaded = await task.downloadAsync();
  if (!downloaded) return; // Paused; nothing to open yet.

  await Sharing.shareAsync(downloaded.uri, {
    // Android's chooser shows this above the target list; iOS ignores it.
    dialogTitle: Platform.OS === 'android' ? fileName : undefined,
  });
}
