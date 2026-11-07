import { View } from "react-native";

import { router } from "expo-router";

import { useTogglePin } from "@/modules/workspace/api/pins";
import { useUnread } from "@/modules/notification/hooks/useUnread";

import { WorkspaceRow } from "./WorkspaceRow";

type DashboardWorkspace = {
  id: string;
  name: string;
  client: string;
  updated: string;
  pinned?: boolean;
};

export function WorkspaceList({
  workspaces,
  role,
}: {
  workspaces: DashboardWorkspace[];
  role: "admin" | "manager" | "client";
}) {
  const togglePin = useTogglePin();
  const unread = useUnread();
  const hrefFor = (workspaceId: string) => {
    if (role === "admin") {
      return `/user/admin/workspaces/${workspaceId}`;
    }

    return `/user/workspaces/${workspaceId}`;
  };

  return (
    <View
      className="
      bg-surface
      dark:bg-dark-surface
      rounded-2xl
      border
      border-border
      dark:border-dark-border
      px-5
      "
    >
      {workspaces.map((workspace) => (
        <WorkspaceRow
          key={workspace.id}
          name={workspace.name}
          client={workspace.client}
          updated={workspace.updated}
          pinned={workspace.pinned}
          unread={unread.forWorkspace(workspace.id)}
          onTogglePin={() =>
            togglePin.mutate({
              workspaceId: workspace.id,
              pinned: !!workspace.pinned,
            })
          }
          onPress={() => router.push(hrefFor(workspace.id))}
        />
      ))}
    </View>
  );
}