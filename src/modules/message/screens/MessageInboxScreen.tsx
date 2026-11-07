import { FlatList, View } from "react-native";

import { useMemo } from "react";

import { useRouter } from "expo-router";

import { useWorkspaces } from "@/modules/workspace/hooks/useWorkspaces";
import { Workspace } from "@/modules/workspace/api/types";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";
import { QueryState } from "@/core/components/QueryState";
import { ListItem } from "@/design-system/ui";
import { Text } from "@/design-system/ui/typography/Text";
import { UnreadBadge } from "@/design-system/ui/display/UnreadBadge";
import { useUnread } from "@/modules/notification/hooks/useUnread";
import { formatRelativeTime } from "@/core/format/formatRelativeTime";

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Messages" },
];

function WorkspaceThread({
  workspace,
  unread,
}: {
  workspace: Workspace;
  unread: number;
}) {
  const router = useRouter();

  return (
    <ListItem
      title={workspace.name}
      subtitle={workspace.description || undefined}
      trailing={
        <View className="flex-row items-center gap-2">
          <UnreadBadge
            count={unread}
            label={`unread messages in ${workspace.name}`}
          />

          <Text
            variant="caption"
            className="text-text-muted dark:text-dark-text-muted"
          >
            {formatRelativeTime(workspace.updated_at)}
          </Text>
        </View>
      }
      onPress={() => router.push(`/user/workspaces/${workspace.id}/messages`)}
    />
  );
}

export function MessageInboxScreen({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useWorkspaces({
      page: 1,
      limit: 100,
      sort: "updated_at",
      order: "desc",
      is_archived: false,
    });

  const unread = useUnread();

  /*
   * Conversations with something waiting are floated to the top.
   *
   * Unlike the workspace list, sorting here is honest: this screen asks for
   * every conversation in one page rather than paginating, so nothing can be
   * left stranded on a later page while appearing to have been reordered.
   *
   * Within each group the server's ordering by recency is preserved, because
   * `sort` is stable and the comparison only distinguishes the two groups.
   */
  const workspaces = useMemo(() => {
    const items = [...(data?.items ?? [])];

    return items.sort(
      (a, b) =>
        Number(unread.forWorkspaceKind(b.id, "message") > 0) -
        Number(unread.forWorkspaceKind(a.id, "message") > 0),
    );
  }, [data?.items, unread]);

  const content = (
    <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={workspaces.length === 0}
        emptyMessage="No conversations yet"
        emptyDescription="Messages appear here once you have an active workspace with your accountant."
        skeletonCount={6}
      >
        <FlatList
          data={workspaces}
          keyExtractor={(workspace) => workspace.id}
          // The list scrolls itself rather than sitting inside the layout's
          // ScrollView. It was previously `scrollEnabled={false}` under a
          // scrolling parent, which silently defeats virtualisation: every row
          // mounts at once, so the limit of 100 above meant a hundred rows
          // rendered to show the eight that fit on screen.
          contentContainerClassName="pb-6"
          ItemSeparatorComponent={() => (
            <View className="ml-4 h-px bg-divider dark:bg-dark-divider" />
          )}
          renderItem={({ item }) => (
            <WorkspaceThread
              workspace={item}
              unread={unread.forWorkspaceKind(item.id, "message")}
            />
          )}
        />
    </QueryState>
  );

  if (embedded) {
    return content;
  }

  return (
    <SharedLayout
      title="Messages"
      breadcrumbs={breadcrumbs}
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
      scroll={false}
    >
      {content}
    </SharedLayout>
  );
}
