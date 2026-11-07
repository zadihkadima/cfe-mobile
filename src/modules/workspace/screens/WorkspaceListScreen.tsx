import React, { useState } from "react";

import { useRouter } from "expo-router";
import { useSelector } from "react-redux";

import { useWorkspaces } from "../hooks/useWorkspaces";
import { WorkspaceCard } from "../components/WorkspaceCard";
import { StatusFilter, WorkspaceStatusTabs } from "../components/WorkspaceStatusTabs";
import { WORKSPACE_STATUS_LABELS } from "../lib/status";
import { RootState } from "@/core/store";
import { PaginatedListScreen } from "@/core/components/PaginatedListScreen";
import { useUnread } from "@/modules/notification/hooks/useUnread";
import { usePinnedWorkspaces, useTogglePin } from "../api/pins";
import { Workspace } from "../api/types";

export function WorkspaceListScreen() {
  const router = useRouter();

  // Defaults to every status rather than to ongoing. Opening on a filter the
  // reader did not choose means the first thing the screen does is hide work
  // from them, and a completed engagement they were looking for reads as
  // missing rather than as filtered.
  const [status, setStatus] = useState<StatusFilter>("all");

  const user = useSelector((state: RootState) => state.auth.user);
  const role = user?.role ?? "client";

  const canCreate = role === "admin";

  const { pinnedIds } = usePinnedWorkspaces();
  const togglePin = useTogglePin();
  const unread = useUnread();

  return (
    <PaginatedListScreen<Workspace>
      title="Workspaces"
      searchPlaceholder="Search workspaces"
      useData={({ search, page }) =>
        useWorkspaces({
          page,
          limit: 20,
          search,
          // Sent to the server rather than filtered here, so the totals and
          // the page count describe the filtered set. Filtering on this side
          // would leave the pager counting pages of a list the reader cannot
          // see, and a page that came back entirely of the wrong status would
          // render as empty with a "2 / 7" underneath it.
          status: status === "all" ? undefined : status,
        })
      }
      filters={<WorkspaceStatusTabs value={status} onChange={setStatus} />}
      // Changing the tab has to reset the page for the same reason a new
      // search does: page three of "ongoing" is not page three of "cancelled".
      filterKey={status}
      keyExtractor={(workspace) => workspace.id}
      renderItem={(workspace) => (
        <WorkspaceCard
          workspace={workspace}
          unread={unread.forWorkspace(workspace.id)}
          // Unlike the dashboard, pinned workspaces are not floated to the top
          // here. This list is paginated by the server, so sorting would only
          // reorder the twenty rows currently loaded -- a pinned workspace on
          // page three would still be on page three, sitting above whichever
          // unpinned rows happened to share its page. That reads as the pin
          // having failed. Ordering has to move server-side before it can be
          // shown, so for now the pin only marks and feeds the dashboard.
          pinned={pinnedIds.has(workspace.id)}
          onTogglePin={() =>
            togglePin.mutate({
              workspaceId: workspace.id,
              pinned: pinnedIds.has(workspace.id),
            })
          }
          onPress={() =>
            router.push(
              role === "admin"
                ? `/user/admin/workspaces/${workspace.id}`
                : `/user/workspaces/${workspace.id}`,
            )
          }
        />
      )}
      emptyTitle={
        status === "all"
          ? "No workspaces yet"
          : `No ${WORKSPACE_STATUS_LABELS[status].toLowerCase()} workspaces`
      }
      emptyDescription={
        status !== "all"
          ? // Says the filter is the cause, so the reader does not conclude
            // that the firm has no work at all and go looking for a fault.
            "Nothing under this status. Try another tab."
          : canCreate
            ? "Create a workspace to start collaborating with a client."
            : "Your accountant will set one up for you."
      }
      // Both omitted for a client, which removes the floating button rather
      // than showing one that leads to a screen they cannot use.
      createLabel={canCreate ? "Create workspace" : undefined}
      onCreate={
        canCreate
          ? () => router.push("/user/admin/workspaces/create")
          : undefined
      }
    />
  );
}
