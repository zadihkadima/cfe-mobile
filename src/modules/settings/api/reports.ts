import { useQuery } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";

import { api } from "@/core/api/client";
import { queryKeys } from "@/core/query/queryKeys";

export type ReportSummary = {
  from: string;
  to: string;

  workspaces: { created: number; active: number };
  tasks: { created: number; completed: number; overdue: number; open: number };
  files: { uploaded: number; total_bytes: number };
  requests: {
    file_requests: number;
    signature_requests: number;
    signatures_signed: number;
    questionnaires: number;
    irs_submissions: number;
  };
  users: { invited: number; active: number; locked: number };
};

export function useReportSummary(from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.reports.summary(from, to),

    queryFn: async () => {
      const { data } = await api.get<ReportSummary>("/reports/summary", {
        params: { from, to },
      });

      return data;
    },

    // The figures do not move quickly and the query is expensive on the
    // server, so a short cache stops flicking between presets from re-running
    // a dozen collection scans.
    staleTime: 60_000,
  });
}

export async function downloadReportCsv(from: string, to: string): Promise<void> {
  const response = await api.get<string>("/reports/summary.csv", {
    params: { from, to },
    responseType: "text",
  });

  const fileName = `firm-report-${from.slice(0, 10)}-to-${to.slice(0, 10)}.csv`;

  if (Platform.OS === "web") {
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, fileName);
  file.write(response.data);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: "text/csv", dialogTitle: "Download report CSV" });
    return;
  }

  await Linking.openURL(file.uri);
}
