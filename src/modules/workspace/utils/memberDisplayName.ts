import type { WorkspaceMember } from "@/modules/workspace/api/types";

/**
 * Returns a person's workspace-safe display name without exposing raw IDs.
 * Administrators are deliberately excluded from the members endpoint, so an
 * unknown creator is represented by their workspace-safe role instead.
 */
export function memberDisplayName(
  members: WorkspaceMember[],
  userId?: string,
  fallbackName?: string,
): string {
  const member = members.find((item) => item.id === userId);

  if (!member) {
    return fallbackName || "Unknown workspace member";
  }

  return `${member.first_name} ${member.last_name}`.trim() || member.email;
}