import { useCallback, useState } from "react";

import type { UploadProgress } from "@/core/api/uploadWorkspaceFile";

export type TransferState = {
  /** What is being transferred, for the label. */
  name: string;

  /** 0 to 1, or null when the total size is unknown. */
  progress: UploadProgress;

  /** Distinguishes a file arriving from one leaving the device. */
  verb: "Uploading" | "Downloading";
};

/**
 * Tracks one transfer at a time for a screen.
 *
 * Deliberately one, not a queue. Every screen here picks a single document and
 * waits for it; modelling a list would add reconciliation code for a case that
 * cannot currently arise, and the first person to upload two files at once
 * would find the bar showing whichever finished last.
 */
export function useTransferProgress() {
  const [transfer, setTransfer] = useState<TransferState | null>(null);

  const start = useCallback((name: string, verb: TransferState["verb"]) => {
    // Starts at null rather than 0 so the bar is indeterminate until the first
    // real measurement arrives. Showing a hard 0% before anything has been
    // reported invites the user to conclude nothing is happening.
    setTransfer({ name, progress: null, verb });
  }, []);

  const report = useCallback((progress: UploadProgress) => {
    setTransfer((current) => (current ? { ...current, progress } : current));
  }, []);

  const finish = useCallback(() => {
    setTransfer(null);
  }, []);

  /**
   * Runs a transfer and clears the bar afterwards, including on failure.
   *
   * The clear is in a finally rather than after the await: a failed upload
   * that leaves the bar on screen looks like one still in flight, and the user
   * waits instead of retrying.
   */
  const track = useCallback(
    async <T,>(
      name: string,
      run: (onProgress: (progress: UploadProgress) => void) => Promise<T>,
      verb: TransferState["verb"] = "Uploading",
    ): Promise<T> => {
      start(name, verb);

      try {
        return await run(report);
      } finally {
        finish();
      }
    },
    [start, report, finish],
  );

  return { transfer, track };
}
