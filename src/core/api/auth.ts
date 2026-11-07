import axios from "axios";

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "@/core/config/env";

// A dedicated instance without interceptors: routing refresh calls through the
// main client would recurse when the refresh call itself returns 401.
const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

export const refreshTokenRequest = async (
  refreshToken: string
) => {
  const res = await authApi.post("/auth/refresh", {
    refresh_token: refreshToken,
  });

  return res.data;
};

/**
 * Revokes a refresh token server-side.
 *
 * Clearing tokens from the device is not a sign-out on its own: the refresh
 * token stays valid for thirty days, so anyone holding a copy - from a device
 * backup, a shared machine, or malware - keeps full access. This call is what
 * actually ends the session.
 *
 * Only the refresh token is sent. Authorizing this with an access token would
 * mean the sign-out failed whenever that token had expired, which is the most
 * common reason to be signing out at all. Possession of the refresh token is
 * the authorization, and the endpoint answers 204 either way.
 */
export const logoutRequest = async (
  refreshToken: string,
) => {
  await authApi.post("/auth/logout", {
    refresh_token: refreshToken,
  });
};

export const forgotPasswordRequest = async (
  email: string,
) => {
  const res = await authApi.post("/auth/forgot-password", {
    email,
  });

  return res.data;
};

export const resetPasswordRequest = async (
  token: string,
  newPassword: string,
) => {
  const res = await authApi.post("/auth/reset-password", {
    token,
    new_password: newPassword,
  });

  return res.data;
};

export const acceptInviteRequest = async (
  token: string,
  password: string,
) => {
  const res = await authApi.post("/auth/accept-invite", {
    token,
    password,
  });
  return res.data;
};