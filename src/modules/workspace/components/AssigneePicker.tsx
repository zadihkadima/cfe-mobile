import { Pressable, Text, View } from "react-native";

import { Check } from "lucide-react-native";

import { Icon } from "@/design-system/ui";
import type { WorkspaceMember } from "@/modules/workspace/api/types";

interface Props {
  label: string;
  members: WorkspaceMember[];
  /** The selected member's id, or empty for unassigned. */
  value: string;
  onChange(value: string): void;
  isLoading?: boolean;
  error?: string;
}

/** The name to show, falling back to the email when a profile is incomplete. */
function displayName(member: WorkspaceMember): string {
  const name = `${member.first_name} ${member.last_name}`.trim();

  return name || member.email;
}

/**
 * Chooses who a task or checklist belongs to.
 *
 * Assignment was previously expressible only by typing an email address into a
 * free-text box, which fails silently on a typo and cannot represent "this
 * person is not on this workspace" at all. The list here is the workspace's own
 * membership, so an unassignable person cannot be named.
 *
 * Rendered as a list rather than a dropdown because a workspace has a client
 * and two or three managers. A dropdown would hide four items behind a tap and
 * add a modal layer to a form that is already inside a scroll view.
 */
export function AssigneePicker({
  label,
  members,
  value,
  onChange,
  isLoading = false,
  error,
}: Props) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
        {label}
      </Text>

      {isLoading ? (
        <Text className="text-sm text-text-secondary dark:text-dark-text-secondary">
          Loading people…
        </Text>
      ) : null}

      {!isLoading && members.length === 0 ? (
        <Text className="text-sm text-text-secondary dark:text-dark-text-secondary">
          No one is assignable on this workspace yet.
        </Text>
      ) : null}

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        className={`overflow-hidden rounded-lg border ${
          error ? "border-danger dark:border-dark-danger" : "border-border dark:border-dark-border"
        }`}
      >
        {/* Unassigned is offered explicitly rather than by clearing the field.
            Assignment is optional, and without a visible way back a user who
            picks the wrong person has no way to undo it. */}
        {[null, ...members].map((member, index) => {
          const id = member?.id ?? "";
          const selected = value === id;

          return (
            <Pressable
              key={id || "unassigned"}
              onPress={() => onChange(id)}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: member?.is_active === false }}
              accessibilityLabel={member ? displayName(member) : "Unassigned"}
              className={`flex-row items-center px-3 py-3 ${
                index > 0 ? "border-t border-border dark:border-dark-border" : ""
              } ${selected ? "bg-primary/10" : ""}`}
            >
              <View className="flex-1">
                <Text
                  className={`${
                    member?.is_active === false
                      ? "text-text-secondary dark:text-dark-text-secondary"
                      : "text-text dark:text-dark-text"
                  } ${selected ? "font-semibold" : ""}`}
                >
                  {member ? displayName(member) : "Unassigned"}
                </Text>

                {member ? (
                  <Text className="text-xs capitalize text-text-secondary dark:text-dark-text-secondary">
                    {/* Deactivated people are still listed, because hiding them
                        makes an existing assignment point at a name the screen
                        cannot resolve. They are labelled so no new work is
                        given to someone who can no longer sign in. */}
                    {member.role}
                    {member.is_active === false ? " · deactivated" : ""}
                  </Text>
                ) : null}
              </View>

              {selected ? <Icon as={Check} size="sm" tone="primary" /> : null}
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text className="mt-1 text-sm font-medium text-danger dark:text-dark-danger">{error}</Text>
      ) : null}
    </View>
  );
}
