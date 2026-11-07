import { View } from "react-native";

import { QueryState } from "@/core/components/QueryState";
import { ScreenScrollView } from "@/design-system/ui/layout/ScreenScrollView";
import { Section } from "@/design-system/ui/layout/Section";

import { ActivityFeed } from "../components/ActivityFeed";
import { OutstandingWorkList } from "../components/OutstandingWorkList";
import { OverviewGrid } from "../components/OverviewGrid";
import { QuickActions } from "../components/QuickActions";
import { WorkspaceList } from "../components/WorkspaceList";

import { useDashboard } from "../hooks/useDashboard";
import { useOutstandingWork } from "../hooks/useOutstandingWork";

export function DashboardScreen() {
  const {
    role,
    cards,
    actions,
    activities,
    recentWorkspaces,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboard();

  // Not folded into the loading gate below. This one request spans four
  // modules and every workspace, so it is the slowest thing on the screen;
  // blocking the whole dashboard on it would make the rest arrive late for the
  // sake of a section the reader has not scrolled to yet.
  const { data: outstanding } = useOutstandingWork();

  if (isLoading || isError) {
    return (
      <View className="flex-1 p-5 bg-background dark:bg-dark-background">
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <ScreenScrollView>
      {/* Outstanding work leads, above workspaces.

          Everything else on this screen answers "what exists"; this answers
          "what needs me", which is the reason someone opens the app between
          nine and five. It merges tasks, checklists, pending file upload
          requests and pending signature requests, because to the person
          reading it those are all just things that are late. */}
      <Section
        title="Needs Your Attention"
        description={
          outstanding
            ? `${outstanding.overdue} overdue · ${outstanding.due_soon} due this week · ${outstanding.assigned_to_me} assigned to you`
            : "Tasks, checklists, file requests and signatures across your workspaces."
        }
      >
        <OutstandingWorkList items={outstanding?.items ?? []} role={role} />
      </Section>

      {/* Workspaces first, statistics last.

          The order used to run Overview, Quick Actions, Recent Activity,
          Recent Workspaces -- which put the least actionable block at the top
          and the one thing people open this app to reach at the bottom, below
          three screenfuls of scrolling. A workspace is where the work is; the
          counts are context you glance at once. So they have traded places.

          (The greeting block that used to sit above all of this was removed
          earlier. It filled the first screenful with "Good morning, client" --
          the role, not the name, because that is what it was given.) */}
      <Section title="Recent Workspaces" description="Recently updated workspaces.">
        <WorkspaceList workspaces={recentWorkspaces} role={role} />
      </Section>

      <Section title="Quick Actions" description="Frequently used actions.">
        <QuickActions actions={actions} />
      </Section>

      <Section title="Recent Activity" description="Latest events across your organization.">
        <ActivityFeed activities={activities} />
      </Section>

      <Section title="Overview" description="Current platform statistics.">
        <OverviewGrid cards={cards} />
      </Section>
    </ScreenScrollView>
  );
}
