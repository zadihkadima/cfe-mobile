import { AxiosError } from "axios";

import { AppError } from "./types";

type ErrorPayload = {
  code?: string;
  error?: string;
  message?: string;
  details?: string;
  request_id?: string;
  errors?: Record<string, string[]>;
};

const MAX_MESSAGE_LENGTH = 300;
const MAX_REQUEST_ID_LENGTH = 128;
const ACCOUNT_LOCKED_CODE = "account_locked";
const ACCOUNT_LOCKED_MESSAGE =
  "This account is locked after too many failed sign-in attempts. Contact support at support@cfe.example to restore access.";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function safeText(value: unknown, maximumLength = MAX_MESSAGE_LENGTH): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const sanitized = Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code < 0x20 || code === 0x7f ? " " : character;
  })
    .join("")
    .trim();

  if (!sanitized) {
    return undefined;
  }

  return sanitized.slice(0, maximumLength);
}

function fieldErrorsFrom(value: unknown): Record<string, string[]> | undefined {
  const fields = asRecord(value);
  if (!fields) {
    return undefined;
  }

  const errors = Object.entries(fields).reduce<Record<string, string[]>>(
    (result, [field, messages]) => {
      const safeField = safeText(field, 64);
      if (!safeField || !Array.isArray(messages)) {
        return result;
      }

      const safeMessages = messages
        .map((message) => safeText(message))
        .filter((message): message is string => Boolean(message))
        .slice(0, 5);

      if (safeMessages.length > 0) {
        result[safeField] = safeMessages;
      }

      return result;
    },
    {},
  );

  return Object.keys(errors).length > 0 ? errors : undefined;
}

function fallbackMessage(status?: number) {
  if (!status) return "Something went wrong. Please try again.";
  if (status === 401) return "Your session expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do this action.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 409) return "This action conflicts with existing data.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "Server error. Please try again shortly.";
  return "Request failed. Please review and try again.";
}

function codeFromResponse(status: number | undefined, payload?: Record<string, unknown>): AppError["code"] {
  if (payload?.code === ACCOUNT_LOCKED_CODE) return "ACCOUNT_LOCKED";
  if (!status) return "NETWORK_ERROR";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

export function normalizeApiError(error: unknown): AppError {
  const axiosError = error as AxiosError<ErrorPayload>;

  const status = axiosError?.response?.status;
  const data = asRecord(axiosError?.response?.data);
  const retryAfter = safeText(axiosError?.response?.headers?.["retry-after"], 10);
  const retryAfterSeconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : undefined;

  // A server message is useful only for recoverable client mistakes. Never
  // show it for authentication, throttling, or server failures: those payloads
  // can contain implementation details and are not actionable for the user.
  // Axios's technical message is deliberately never shown either.
  const mayUseServerMessage =
    status !== undefined && status >= 400 && status < 500 && ![401, 403, 429].includes(status);
  const code = codeFromResponse(status, data);
  const message =
    (code === "ACCOUNT_LOCKED" && ACCOUNT_LOCKED_MESSAGE) ||
    (mayUseServerMessage &&
      (safeText(data?.error) || safeText(data?.message) || safeText(data?.details))) ||
    fallbackMessage(status);

  return {
    code,
    message,
    status,
    fieldErrors: fieldErrorsFrom(data?.errors),
    requestId: safeText(data?.request_id, MAX_REQUEST_ID_LENGTH),
    retryAfterSeconds,
    raw: error,
  };
}
