import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useSelector } from "react-redux";

import { QueryState } from "@/core/components/QueryState";
import { RootState } from "@/core/store";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";
import { PressableScale } from "@/design-system/ui/motion/PressableScale";
import { DateField } from "@/design-system/ui/input/DateField";

import { downloadReportCsv, ReportSummary, useReportSummary } from "../api/reports";

/**
 * The ranges people actually ask for.
 *
 * Presets rather than two date pickers as the primary control: a report is
 * usually wanted for "this month" or "this quarter", and making that three
 * taps through a calendar is how a report goes unread.
 */
const PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
] as const;

function toDateOnly(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <View className="mb-3 w-[48%] rounded-2xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
      <Text
        className={
          tone === "danger"
            ? "text-2xl font-bold text-danger"
            : "text-2xl font-bold text-text dark:text-dark-text"
        }
      >
        {value}
      </Text>

      <Text className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">{label}</Text>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary">
        {title}
      </Text>

      <View className="flex-row flex-wrap justify-between">{children}</View>
    </View>
  );
}

function Body({ summary, isAdmin }: { summary: ReportSummary; isAdmin: boolean }) {
  return (
    <>
      <Group title="Workspaces">
        <Metric label="Created in range" value={String(summary.workspaces.created)} />
        <Metric label="Active now" value={String(summary.workspaces.active)} />
      </Group>

      <Group title="Tasks">
        <Metric label="Created in range" value={String(summary.tasks.created)} />
        <Metric label="Completed in range" value={String(summary.tasks.completed)} />
        <Metric label="Open now" value={String(summary.tasks.open)} />

        {/* Measured now, not at the end of the range: a task that was late
            last month and is now finished is not something to chase. */}
        <Metric
          label="Overdue now"
          value={String(summary.tasks.overdue)}
          tone={summary.tasks.overdue > 0 ? "danger" : undefined}
        />
      </Group>

      <Group title="Documents">
        <Metric label="Files uploaded" value={String(summary.files.uploaded)} />
        <Metric label="Storage added" value={formatBytes(summary.files.total_bytes)} />
      </Group>

      <Group title="Requests">
        <Metric label="File requests" value={String(summary.requests.file_requests)} />
        <Metric label="Signature requests" value={String(summary.requests.signature_requests)} />
        <Metric label="Signed" value={String(summary.requests.signatures_signed)} />
        <Metric label="Questionnaires" value={String(summary.requests.questionnaires)} />
        <Metric label="IRS submissions" value={String(summary.requests.irs_submissions)} />
      </Group>

      {/* Only an admin sees headcount. A manager's report is about their
          workspaces, and the server returns zeroes for them, which would read
          as "no users exist" rather than "not your figures". */}
      {isAdmin ? (
        <Group title="People">
          <Metric label="Joined in range" value={String(summary.users.invited)} />
          <Metric label="Active accounts" value={String(summary.users.active)} />
          <Metric
            label="Locked out"
            value={String(summary.users.locked)}
            tone={summary.users.locked > 0 ? "danger" : undefined}
          />
        </Group>
      ) : null}
    </>
  );
}

export function ReportsScreen() {
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const [days, setDays] = useState<number>(30);
  const [customRange, setCustomRange] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);

  // Recomputed only when the preset changes, so the query key stays stable
  // between renders. Deriving "now" inline would change the key on every
  // render and refetch forever.
  const presetRange = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

    return { from: from.toISOString(), to: to.toISOString() };
  }, [days]);

  const range = customRange && fromDate && toDate
    ? { from: fromDate, to: toDate }
    : presetRange;

  const query = useReportSummary(range.from, range.to);

  return (
    <SharedLayout title="Reports">
      <View className="px-4 pt-2">
        <View className="mb-4 flex-row">
          {PRESETS.map((preset) => (
            <PressableScale
              key={preset.days}
              onPress={() => { setDays(preset.days); setCustomRange(false); }}
              className={
                !customRange && days === preset.days
                  ? "mr-2 rounded-full bg-primary px-4 py-2"
                  : "mr-2 rounded-full border border-border px-4 py-2 dark:border-dark-border"
              }
            >
              <Text
                className={
                  !customRange && days === preset.days
                    ? "text-xs font-semibold text-white"
                    : "text-xs font-semibold text-text-secondary dark:text-dark-text-secondary"
                }
              >
                {preset.label}
              </Text>
            </PressableScale>
          ))}
          <PressableScale
            onPress={() => {
              const now = new Date();
              setFromDate(`${now.getFullYear()}-01-01`);
              setToDate(toDateOnly(now));
              setCustomRange(true);
            }}
            className={customRange && fromDate.endsWith("-01-01") ? "mr-2 rounded-full bg-primary px-4 py-2 dark:bg-dark-primary" : "mr-2 rounded-full border border-border px-4 py-2 dark:border-dark-border"}
          >
            <Text className={customRange && fromDate.endsWith("-01-01") ? "text-xs font-semibold text-white" : "text-xs font-semibold text-text-secondary dark:text-dark-text-secondary"}>This year</Text>
          </PressableScale>
          <PressableScale
            onPress={() => setCustomRange(true)}
            className={customRange && !fromDate.endsWith("-01-01") ? "rounded-full bg-primary px-4 py-2 dark:bg-dark-primary" : "rounded-full border border-border px-4 py-2 dark:border-dark-border"}
          >
            <Text className={customRange && !fromDate.endsWith("-01-01") ? "text-xs font-semibold text-white" : "text-xs font-semibold text-text-secondary dark:text-dark-text-secondary"}>Custom</Text>
          </PressableScale>
        </View>

        {customRange ? (
          <View className="mb-4 rounded-2xl border border-border bg-surface p-4 dark:border-dark-border dark:bg-dark-surface">
            <DateField label="From" value={fromDate} onChange={setFromDate} clearable={false} />
            <DateField label="To" value={toDate} onChange={setToDate} clearable={false} />
            <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">Choose up to one year, including a full calendar year.</Text>
          </View>
        ) : null}

        {role === "admin" ? (
          <PressableScale
            disabled={exporting}
            onPress={() => {
              setExporting(true);
              void downloadReportCsv(range.from, range.to).finally(() => setExporting(false));
            }}
            className="mb-4 items-center rounded-xl bg-primary px-4 py-3 dark:bg-dark-primary"
          >
            <Text className="font-semibold text-white">{exporting ? "Preparing CSV…" : "Download CSV"}</Text>
          </PressableScale>
        ) : null}

        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          skeletonCount={6}
          onRetry={query.refetch}
        >
          {query.data ? <Body summary={query.data} isAdmin={role === "admin"} /> : null}
        </QueryState>
      </View>
    </SharedLayout>
  );
}
