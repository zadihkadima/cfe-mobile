

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { tokenService } from "../auth/tokenService";
import {
  endSession,
  SESSION_EXPIRED_MESSAGE,
} from "../auth/endSession";
import { refreshTokenRequest } from "./auth";
import { store } from "../store";
import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { showError } from "@/core/store/notificationSlice";
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "@/core/config/env";

export { API_BASE_URL };

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

type QueueItem = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};

let isRefreshing = false;
let queue: QueueItem[] = [];

const processQueue = (
  token?: string,
  error?: any
) => {
  queue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });

  queue = [];
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers = config.headers ?? {};

    const isAuthEndpoint =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/refresh") ||
      config.url?.includes("/auth/forgot-password") ||
      config.url?.includes("/auth/reset-password");

    if (!isAuthEndpoint) {
      const token = tokenService.getAccessToken();
      const workspaceId =
        store.getState().workspace.activeWorkspaceId;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (workspaceId) {
        config.headers["x-workspace-id"] = workspaceId;
      }
    }

    return config;
  }
);

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    if (__DEV__) {
      // Only the request line and status are logged. The AxiosError carries
      // `config.headers`, which holds the bearer token, so logging the error
      // object itself would write a live credential into the device log where
      // any other process reading logcat can retrieve it.
      console.error(
        "API error",
        error.config?.method?.toUpperCase(),
        error.config?.url,
        error.response?.status ?? "(no response)",
      );
    }

    if (!error.response) {
      const appError = normalizeApiError(error);
      store.dispatch(
        showError(
          appError.message ||
            "Network error. Please check your connection.",
        ),
      );

      return Promise.reject(error);
    }

    const original =
      error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!original) {
      return Promise.reject(error);
    }

    // Don't refresh login/refresh endpoints
    if (
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/forgot-password") ||
      original.url?.includes("/auth/reset-password")
    ) {
      return Promise.reject(error);
    }

    // Only handle 401
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (original._retry) {
      endSession(SESSION_EXPIRED_MESSAGE);
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers.Authorization =
              `Bearer ${token}`;

            resolve(api(original));
          },

          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken =
        tokenService.getRefreshToken();

      if (!refreshToken) {
        endSession(SESSION_EXPIRED_MESSAGE);

        processQueue(undefined, error);

        return Promise.reject(error);
      }

      const data =
        await refreshTokenRequest(refreshToken);

      const newAccessToken =
        data.access_token;

      const newRefreshToken =
        data.refresh_token ?? refreshToken;

      tokenService.setTokens(
        newAccessToken,
        newRefreshToken
      );

      processQueue(newAccessToken);

      original.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(original);
    } catch (refreshError) {
      if (__DEV__) {
        // As above, the error object carries the refresh token in its request
        // config; a refresh token is longer-lived than an access token and so
        // is the more damaging of the two to leak.
        console.error("Token refresh failed");
      }

      processQueue(undefined, refreshError);

      endSession(SESSION_EXPIRED_MESSAGE);

      // Normalised to an Error before rejecting. A caught value is typed
      // `unknown` and rejecting with a non-Error loses the stack trace, which
      // is the only thing that makes a refresh failure diagnosable after the
      // fact. Axios always throws an Error, so the fallback is defensive
      // rather than expected.
      return Promise.reject(
        refreshError instanceof Error
          ? refreshError
          : new Error(String(refreshError)),
      );
    } finally {
      isRefreshing = false;
    }
  }
);