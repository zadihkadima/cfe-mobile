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
};

export type UpdateClientRequest = {
  first_name?: string;
  last_name?: string;
  email?: string;
  tax_id?: string;
  social_security_number?: string;
  is_active?: boolean;
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