/**
 * Types for the manager-facing client endpoints (`/api/v1/manager/clients`).
 *
 * These mirror the admin client types in shape but are a separate module on
 * purpose: the manager endpoints are scoped to the clients assigned to the
 * caller, so a type that said only "Client" would hide that difference at the
 * exact seam where the two are most easily confused.
 */

export type ManagerClient = {
  id: string;

  first_name: string;
  last_name: string;
  email: string;

  role: "client";

  is_active: boolean;
  invited: boolean;
  tax_id?: string;
  social_security_number?: string;

  date_of_birth?: string | null;
  client_code?: string | null;
  reason_for_consultation?: string | null;

  created_at: string;
  updated_at: string;

  avatar_url?: string;
  locked_at?: string | null;
};

export type CreateManagerClientRequest = {
  first_name: string;
  last_name: string;
  email: string;

  date_of_birth?: string;
  client_code?: string;
  reason_for_consultation?: string;
};

export type UpdateManagerClientRequest = {
  first_name?: string;
  last_name?: string;
  email?: string;
  tax_id?: string;
  social_security_number?: string;
  is_active?: boolean;

  date_of_birth?: string;
  client_code?: string;
  reason_for_consultation?: string;
};

export type ListManagerClientsParams = {
  search?: string;

  page?: number;
  limit?: number;

  sort?: string;
  order?: "asc" | "desc";

  is_active?: boolean;
  invited?: boolean;
  locked?: boolean;
};

export type ListManagerClientsResponse = {
  items: ManagerClient[];

  page: number;
  limit: number;

  total: number;
  total_pages: number;
};
