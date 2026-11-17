import type { UserRole } from "@/modules/auth/types/auth.types";

/**
 * What each role may do, stated once and read everywhere.
 *
 * These are presentation decisions, not protection: the API enforces the same
 * rules, and has to, because anyone can call it without going through this
 * app. What the gates buy is a UI that does not offer work the caller cannot
 * do -- a manager seeing "Add manager" and getting a 403, or a client finding
 * a create button at all.
 *
 * The rules come from the client feedback:
 *  - only administrators may create managers;
 *  - managers may add clients and work with the clients assigned to them, but
 *    not with clients assigned to another manager;
 *  - clients may create nothing.
 */
export type Permission =
  | "clients.list"
  | "clients.create"
  | "clients.edit"
  | "clients.delete"
  | "managers.list"
  | "managers.create"
  | "managers.edit"
  | "managers.delete"
  | "workspaces.create";

const ADMIN_PERMISSIONS: Permission[] = [
  "clients.list",
  "clients.create",
  "clients.edit",
  "clients.delete",
  "managers.list",
  "managers.create",
  "managers.edit",
  "managers.delete",
  "workspaces.create",
];

const MANAGER_PERMISSIONS: Permission[] = [
  // A manager's client work is the administrator's client work, narrower: the
  // server scopes it to the clients assigned to the caller, and the UI offers
  // only what that scope can hold.
  "clients.list",
  "clients.create",
  "clients.edit",
  "clients.delete",
  "workspaces.create",
];

const CLIENT_PERMISSIONS: Permission[] = [];

const PERMISSIONS_BY_ROLE: Record<UserRole, Permission[]> = {
  admin: ADMIN_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  client: CLIENT_PERMISSIONS,
};

export function can(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS_BY_ROLE[role]?.includes(permission) ?? false;
}
