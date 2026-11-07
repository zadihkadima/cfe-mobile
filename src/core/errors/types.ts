export type AppErrorCode =
  | "NETWORK_ERROR"
  | "UNAUTHORIZED"
  | "ACCOUNT_LOCKED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export type AppError = {
  code: AppErrorCode;
  message: string;
  status?: number;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  retryAfterSeconds?: number;
  raw?: unknown;
};
