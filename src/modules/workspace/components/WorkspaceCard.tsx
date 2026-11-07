import React from "react";

import { Pressable, View } from "react-native";
import { Archive, Pin, PinOff, Users } from "lucide-react-native";

import { Workspace } from "../api/types";
import {
  WORKSPACE_STATUS_LABELS,
  WORKSPACE_STATUS_TONES,
  workspaceStatus,
} from "../lib/status";
import { Badge, ListItem } from "@/design-system/ui";
import { Text } from "@/design-system/ui/typography/Text";
import { UnreadBadge } from "@/design-system/ui/display/UnreadBadge";
import { useTheme } from "@/design-system/theme/useTheme";
import { formatRelativeTime } from "@/core/format/formatRelativeTime";

type Props = {
  workspace: Workspace;
  onPress: () => void;

  /** Whether this workspace is pinned. Only meaningful with `onTogglePin`. */
  pinned?: boolean;

  /**
   * Omitted where pinning is not offered, which removes the control entirely
   * rather than showing one that does nothing.
   */
  onTogglePin?: () => void;

  /** How much unseen work is waiting in this workspace, across everything. */
  unread?: number;
};

/**
 * One workspace in a list.
 *
 * The client's raw identifier used to be printed on every row as
 * "Client: 665f1a...". A Mongo ObjectID tells the reader nothing they can act
 * on, and printing internal identifiers to end users teaches them that parts of
 * the product are not meant for them. It is dropped rather than resolved,
 * because the list endpoint returns only `client_id` and looking each one up
 * would mean a request per row.
 *
 * What replaces it is what a person actually scans a workspace list for: how
 * recently it moved, and whether anyone is on it.
 */
export function WorkspaceCard({
  workspace,
  onPress,
  pinned = false,
  onTogglePin,
  unread = 0,
}: Props) {
  const { theme } = useTheme();

  // Defended against `null`, not merely against `undefined`. The type says
  // `string[]`, but a nil slice in Go marshals to JSON `null` rather than to
  // `[]`, so a workspace with no managers arrives with the field present and
  // empty of an array. Reading `.length` off that throws while rendering a
  // row, which unmounts the whole list -- the user sees an empty screen, or
  // the error boundary, and no indication that one record was malformed.
  const managerCount = workspace.manager_ids?.length ?? 0;

  // Ongoing is not badged. It is the state most workspaces are in most of the
  // time, so a badge saying so would appear on nearly every row and stop being
  // read -- taking the badge that does mean something down with it.
  const status = workspaceStatus(workspace);
  const showStatus = status !== "ongoing";

  return (
    <ListItem
      title={workspace.name}
      subtitle={workspace.description || undefined}
      onPress={onPress}
      leading={
        workspace.is_archived ? (
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-variant dark:bg-dark-surface-variant">
            <Archive size={16} color={theme.colors.textMuted} />
          </View>
        ) : undefined
      }
      trailing={
        <View className="flex-row items-center">
          {/* Before the pin, so it sits closest to the row's own content and
              is not mistaken for part of the pin control. */}
          <View className="mr-2">
            <UnreadBadge
              count={unread}
              label={`unread in ${workspace.name}`}
            />
          </View>

          {onTogglePin ? (
            <Pressable
              onPress={onTogglePin}
              accessibilityRole="button"
              accessibilityLabel={pinned ? `Unpin ${workspace.name}` : `Pin ${workspace.name}`}
              // A small target sitting on top of the row's own pressable is
              // how a near-miss opens the workspace instead of pinning it, so
              // the tap area is padded well beyond the icon.
              hitSlop={8}
              className="mr-1 h-10 w-10 items-center justify-center rounded-full"
            >
              {pinned ? (
                <Pin size={17} color={theme.colors.primary} fill={theme.colors.primary} />
              ) : (
                <PinOff size={17} color={theme.colors.textMuted} />
              )}
            </Pressable>
          ) : null}

          <View className="items-end gap-1">
            {showStatus ? (
              <Badge
                label={WORKSPACE_STATUS_LABELS[status]}
                tone={WORKSPACE_STATUS_TONES[status]}
              />
            ) : null}

            <Text
              variant="caption"
              className="text-text-muted dark:text-dark-text-muted"
            >
              {formatRelativeTime(workspace.updated_at)}
            </Text>

            <View className="flex-row items-center gap-1">
              <Users size={12} color={theme.colors.textMuted} />
              <Text
                variant="caption"
                className="text-text-muted dark:text-dark-text-muted"
              >
                {managerCount}
              </Text>
            </View>
          </View>
        </View>
      }
    />
  );
}
