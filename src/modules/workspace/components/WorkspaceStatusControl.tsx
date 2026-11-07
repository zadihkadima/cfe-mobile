import { useState } from "react";

import { View } from "react-native";

import { Badge, BottomSheet, PressableScale } from "@/design-system/ui";
import { Text } from "@/design-system/ui/typography/Text";

import { useUpdateWorkspace } from "../hooks/useUpdateWorkspace";
import {
  WORKSPACE_STATUSES,
  WORKSPACE_STATUS_DESCRIPTIONS,
  WORKSPACE_STATUS_LABELS,
  WORKSPACE_STATUS_TONES,
  WorkspaceStatus,
} from "../lib/status";

/**
 * The workspace's status, and for an administrator, the way to change it.
 *
 * A badge for everyone else rather than a hidden control. Where the work
 * stands is something a client and a manager both need to know -- it is the
 * answer to "is anyone still working on this" -- and only the decision to
 * change it belongs to an admin. Hiding the badge along with the control would
 * withhold the fact in order to withhold the permission.
 *
 * The sheet explains each status in a sentence rather than listing four words.
 * The distinction between cancelled and on hold is a judgement about whether
 * the work is coming back, and getting it wrong leaves either a dead
 * engagement people keep chasing or a live one nobody is watching. That is not
 * recoverable from the labels alone.
 */
export function WorkspaceStatusControl({
  workspaceId,
  status,
  canEdit,
}: {
  workspaceId: string;
  status: WorkspaceStatus;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const update = useUpdateWorkspace();

  const badge = (
    <Badge label={WORKSPACE_STATUS_LABELS[status]} tone={WORKSPACE_STATUS_TONES[status]} />
  );

  if (!canEdit) {
    return badge;
  }

  return (
    <>
      <PressableScale
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Status: ${WORKSPACE_STATUS_LABELS[status]}. Change it.`}
        // A badge is small and sits beside other controls, so the tap area is
        // padded well past what is drawn.
        hitSlop={8}
        scaleTo={0.94}
      >
        {badge}
      </PressableScale>

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Workspace status"
        description="Where this engagement stands. Everyone on the workspace can see it."
        scrollable
      >
        <View>
          {WORKSPACE_STATUSES.map((option) => {
            const selected = option === status;

            return (
              <PressableScale
                key={option}
                // Choosing the status it already has would send a request that
                // changes nothing and show a success message for work that did
                // not happen.
                disabled={selected || update.isPending}
                onPress={() => {
                  update.mutate(
                    { id: workspaceId, data: { status: option } },
                    { onSuccess: () => setOpen(false) },
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel={WORKSPACE_STATUS_LABELS[option]}
                accessibilityState={{ selected, disabled: selected || update.isPending }}
                className="border-b border-border py-3 last:border-b-0 dark:border-dark-border"
                scaleTo={0.98}
              >
                <View className="flex-row items-center gap-2">
                  <Badge
                    label={WORKSPACE_STATUS_LABELS[option]}
                    tone={WORKSPACE_STATUS_TONES[option]}
                  />

                  {selected ? (
                    <Text
                      variant="caption"
                      className="text-text-secondary dark:text-dark-text-secondary"
                    >
                      Current
                    </Text>
                  ) : null}
                </View>

                <Text
                  variant="caption"
                  className="mt-1 text-text-secondary dark:text-dark-text-secondary"
                >
                  {WORKSPACE_STATUS_DESCRIPTIONS[option]}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}
