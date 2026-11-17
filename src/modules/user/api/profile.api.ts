import { api } from "@/core/api/client";

export type MyProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "manager" | "client";
  tax_id?: string;
  social_security_number?: string;

  /**
   * Birthdate as `YYYY-MM-DD`, absent until supplied. Shared by every role --
   * the feedback asked for it in registration, the client profile, and the
   * client detail views, so it lives on the account itself.
   */
  date_of_birth?: string | null;

  /** Firm-assigned identifier, present once the account is provisioned. */
  client_code?: string | null;

  /** Free-text reason for consulting. Optional by design. */
  reason_for_consultation?: string | null;

  /**
   * Set when `social_security_number` carries only the last four digits. Lets
   * the UI tell "masked" from "no SSN on file", which an empty string alone
   * cannot.
   */
  ssn_masked?: boolean;

  two_factor_enabled?: boolean;

  /**
   * A signed link to this account's picture, absent when it has none.
   *
   * A link rather than a storage key, because the key is an internal path and
   * for the S3 backend is not something a client should be shown. The link
   * carries its own signature, so an <Image> can fetch it without sending an
   * Authorization header -- which it cannot do.
   */
  avatar_url?: string;

  is_active: boolean;
  invited: boolean;
  created_at: string;
  updated_at: string;
};

export type UpdateMyProfileRequest = {
  first_name?: string;
  last_name?: string;
  email?: string;
  tax_id?: string;
  social_security_number?: string;

  date_of_birth?: string;
  client_code?: string;
  reason_for_consultation?: string;
};

export const getMyProfile = async (): Promise<MyProfile> => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const updateMyProfile = async (
  data: UpdateMyProfileRequest,
): Promise<void> => {
  await api.patch("/auth/me", data);
};

/**
 * Replaces the signed-in account's picture.
 *
 * The account is never named in the request. The server takes it from the
 * session, so this cannot be pointed at anyone else -- which matters more than
 * it might seem, because in a conversation the picture is the fastest way to
 * tell who is speaking.
 */
export const uploadMyAvatar = async (picked: {
  uri: string;
  name: string;
  mimeType: string;
}): Promise<{ avatar_url: string }> => {
  const form = new FormData();

  // React Native's FormData takes this shape rather than a Blob: the file is
  // streamed from the given uri by the native layer, so the bytes never pass
  // through JavaScript. Casting is necessary because the DOM typings describe
  // the web's FormData, which has no such form.
  form.append("file", {
    uri: picked.uri,
    name: picked.name,
    type: picked.mimeType,
  } as unknown as Blob);

  const res = await api.post("/auth/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};
