import { tokenService } from "./tokenService";
import { endSession, SESSION_EXPIRED_MESSAGE } from "./endSession";
import { api } from "../api/client";
import { refreshTokenRequest } from "@/core/api/auth";
import {
  setUser,
  setHydrated,
} from "../store/authSlice";
import { store } from "../store";
import { normalizeApiError } from "@/core/errors/normalizeApiError";

export const bootstrapAuth = async () => {
  try {
    const token = tokenService.getAccessToken();

    if (!token) {
      store.dispatch(setHydrated(true));
      return;
    }

    try {
      const res = await api.get("/auth/me");
      store.dispatch(setUser(res.data));
      return;
    } catch (error: unknown) {
      const appError = normalizeApiError(error);
      const refreshToken = tokenService.getRefreshToken();

      if (appError.code === "UNAUTHORIZED" && refreshToken) {
        try {
          const refreshData = await refreshTokenRequest(refreshToken);
          tokenService.setTokens(
            refreshData.access_token,
            refreshData.refresh_token ?? refreshToken,
          );

          const retry = await api.get("/auth/me");
          store.dispatch(setUser(retry.data));
          return;
        } catch (_refreshError) {
          if (__DEV__) {
            // The error object carries the request config, and therefore the
            // refresh token, so only the fact of the failure is logged.
            console.error("Bootstrap refresh failed");
          }
        }
      }

      endSession(
        appError.code === "UNAUTHORIZED"
          ? SESSION_EXPIRED_MESSAGE
          : appError.message || "Unable to restore your session.",
      );
    }
  } finally {
    store.dispatch(setHydrated(true));
  }
};
