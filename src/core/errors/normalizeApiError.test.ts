import { AxiosError } from "axios";

import { normalizeApiError } from "./normalizeApiError";

function httpError(status: number, data?: unknown): AxiosError {
  const error = new AxiosError("Request failed with status code " + status);
  error.response = {
    status,
    statusText: "",
    data: data ?? {},
    headers: {},
    config: {} as never,
  };
  return error;
}

/**
 * Every user-visible error message in the app passes through here, so this
 * function decides both what a user is told and what a user is *not* told.
 * A regression that leaked a raw exception string would put internal URLs and
 * stack fragments on the screen of a tax platform.
 */
describe("normalizeApiError", () => {
  it("uses a sanitized server message for a recoverable validation error", () => {
    const { message } = normalizeApiError(
      httpError(422, { error: "Please provide a valid email address" }),
    );

    expect(message).toBe("Please provide a valid email address");
  });

  it.each([401, 403, 429, 500, 503])(
    "does not expose server text for status %i",
    (status) => {
      const { message } = normalizeApiError(
        httpError(status, { error: "database password=secret" }),
      );

      expect(message).not.toContain("password=secret");
    },
  );

  it("turns the known account-lock code into a fixed support message", () => {
    const result = normalizeApiError(
      httpError(403, {
        code: "account_locked",
        error: "untrusted backend detail",
      }),
    );

    expect(result.code).toBe("ACCOUNT_LOCKED");
    expect(result.message).toContain("support@cfe.example");
    expect(result.message).not.toContain("untrusted backend detail");
  });

  it("falls back through the alternative payload shapes the API uses", () => {
    expect(normalizeApiError(httpError(400, { message: "bad input" })).message).toBe(
      "bad input",
    );

    expect(normalizeApiError(httpError(400, { details: "more detail" })).message).toBe(
      "more detail",
    );
  });

  it("explains an empty-bodied failure in the user's terms", () => {
    expect(normalizeApiError(httpError(401)).message).toContain("session");
    expect(normalizeApiError(httpError(403)).message).toContain("permission");
    expect(normalizeApiError(httpError(404)).message).toContain("not found");
    expect(normalizeApiError(httpError(500)).message).toContain("Server error");
  });

  it.each([
    [401, "UNAUTHORIZED"],
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
    [409, "CONFLICT"],
    [422, "VALIDATION_ERROR"],
    [500, "SERVER_ERROR"],
    [503, "SERVER_ERROR"],
    [418, "UNKNOWN_ERROR"],
  ])("maps status %i to %s", (status, code) => {
    expect(normalizeApiError(httpError(status)).code).toBe(code);
  });

  it("classifies a request that never reached the server as a network error", () => {
    const result = normalizeApiError(new AxiosError("Network Error"));

    expect(result.code).toBe("NETWORK_ERROR");
    expect(result.status).toBeUndefined();
  });

  it("surfaces field errors so a form can bind them", () => {
    const { fieldErrors } = normalizeApiError(
      httpError(422, { errors: { email: ["is already taken"] } }),
    );

    expect(fieldErrors).toEqual({ email: ["is already taken"] });
  });

  it("sanitizes malformed error payloads before they reach the UI", () => {
    const result = normalizeApiError(
      httpError(422, {
        error: "\u0000Invalid\ninput",
        errors: {
          email: ["\u0000Not valid\n"],
          ignored: "not an array",
        },
      }),
    );

    expect(result.message).toBe("Invalid input");
    expect(result.fieldErrors).toEqual({ email: ["Not valid"] });
  });

  it("carries the request id through for support correlation", () => {
    // This is what lets a user's screenshot be matched to a backend audit
    // record and an access log entry.
    const { requestId } = normalizeApiError(
      httpError(500, { request_id: "abc-123" }),
    );

    expect(requestId).toBe("abc-123");
  });

  it("reads a valid Retry-After header for throttled requests", () => {
    const error = httpError(429);
    error.response!.headers = { "retry-after": "30" };

    const result = normalizeApiError(error);

    expect(result.code).toBe("RATE_LIMITED");
    expect(result.retryAfterSeconds).toBe(30);
  });

  it("never throws, whatever it is handed", () => {
    expect(() => normalizeApiError(undefined)).not.toThrow();
    expect(() => normalizeApiError(null)).not.toThrow();
    expect(() => normalizeApiError("a string")).not.toThrow();
    expect(() => normalizeApiError({})).not.toThrow();

    expect(normalizeApiError(null).message).toBeTruthy();
  });

  it("always produces a non-empty message", () => {
    // The UI renders this directly; an empty string would show a blank error.
    expect(normalizeApiError(httpError(500, { error: "" })).message).toBeTruthy();
  });
});
