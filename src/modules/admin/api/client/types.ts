export type Client = {
  id: string;

  first_name: string;
  last_name: string;
  email: string;

  role: "client";

  is_active: boolean;
  invited: boolean;
  tax_id?: string;
  social_security_number?: string;

  /**
   * Birthdate as `YYYY-MM-DD`, absent until the client supplies it. Optional
   * because an invited client has not completed onboarding yet.
   */
  date_of_birth?: string | null;

  /**
   * Firm-assigned identifier shown to the client. Optional because it is only
   * assigned once the account is provisioned.
   */
  client_code?: string | null;

  /**
   * Free-text reason the client is consulting the firm. Optional by design:
   * the feedback asked for it as an optional field, so its absence is normal.
   */
  reason_for_consultation?: string | null;

  created_at: string;
  updated_at: string;

  /**
   * A link to this account's picture, absent when it has none.
   *
   * A signed link rather than a storage key: it can be fetched by an <Image>
   * without an Authorization header, which an image element cannot send.
   */
  avatar_url?: string;

  /**
   * Set when the account locked itself after repeated wrong passwords.
   *
   * Optional because the field is omitted for accounts that are fine, so
   * its presence is the whole signal.
   */
  locked_at?: string | null;
};

export type CreateClientRequest = {
  first_name: string;
  last_name: string;
  email: string;

  date_of_birth?: string;
  client_code?: string;
  reason_for_consultation?: string;
};

export type UpdateClientRequest = {
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

export type ListClientsParams = {
  search?: string;

  page?: number;
  limit?: number;

  sort?: string;
  order?: "asc" | "desc";

  is_active?: boolean;
  invited?: boolean;
  locked?: boolean;
};

export type ListClientsResponse = {
  items: Client[];

  page: number;
  limit: number;

  total: number;
  total_pages: number;
};