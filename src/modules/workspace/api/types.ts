import { WorkspaceStatus } from "../lib/status";

export type Workspace = {
  id: string;

  name: string;
  description: string;

  client_id: string;

  /**
   * Resolved per request rather than stored, so it is absent when the account
   * has been deleted or a server predating the field is answering.
   *
   * Never fall back to `client_id` when it is missing: an identifier where a
   * name belongs reads as corrupted data, which is worse than no subtitle.
   */
  client_name?: string;

  manager_ids: string[];

  created_by: string;

  is_archived: boolean;

  /**
   * Optional because a server that predates this field sends nothing. Read it
   * through `workspaceStatus` rather than directly, so the absent case lands
   * on ongoing instead of on no badge at all.
   */
  status?: WorkspaceStatus;

  created_at: string;
  updated_at: string;
};

export type CreateWorkspaceRequest = {
  name: string;

  description: string;

  client_id: string;

  manager_ids: string[];
};

export type UpdateWorkspaceRequest = {
  name?: string;

  description?: string;

  client_id?: string;

  manager_ids?: string[];

  is_archived?: boolean;

  status?: WorkspaceStatus;
};

export type ListWorkspaceParams = {
  search?: string;

  page?: number;
  limit?: number;

  sort?: string;
  order?: "asc" | "desc";

  client_id?: string;

  manager_id?: string;

  is_archived?: boolean;

  /** Omitted means every status, which is the unfiltered list rather than a fifth state. */
  status?: WorkspaceStatus;
};

export type ListWorkspaceResponse = {
  items: Workspace[];

  page: number;
  limit: number;

  total: number;
  total_pages: number;
};

export type WorkspaceClientDetails = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "client";
  tax_id?: string;
  social_security_number?: string;
  is_active: boolean;
  invited: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Someone work in a workspace can be assigned to.
 *
 * Deliberately narrower than WorkspaceClientDetails above: the members
 * endpoint returns no tax identifiers, because a picker has no use for them
 * and every manager would otherwise receive them on every visit.
 */
export type WorkspaceMember = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "client" | "manager" | "admin";
  is_active: boolean;

  /**
   * A link to this member's picture, absent when they have none.
   *
   * Carried even though this record is deliberately narrow, because a picker is
   * read by scanning rather than line by line, and a face is what makes that
   * possible.
   */
  avatar_url?: string;
};

export type WorkspaceMembersResponse = {
  items: WorkspaceMember[];
  total: number;
};