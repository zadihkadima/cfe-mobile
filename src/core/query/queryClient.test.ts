import { AxiosError } from "axios";

import { shouldRetry } from "./queryClient";

function httpError(status: number): AxiosError {
  const error = new AxiosError("Request failed");
  error.response = {
    status,
    statusText: "",
    data: {},
    headers: {},
    config: {} as never,
  };
  return error;
}

/**
 * The client previously used a bare `new QueryClient()`, which retries every
 * failure three times. That meant a single genuine 403 became three rejected
 * requests, and because the API is rate limited, a user who hit one permission
 * error could find their subsequent legitimate requests throttled. Retrying an
 * authorisation failure also cannot succeed by construction, so the cost was
 * paid for no possible benefit.
 */
describe("shouldRetry", () => {
  it.each([400, 401, 403, 404, 409, 422, 429])(
    "does not retry %i, which cannot succeed on repetition",
    (status) => {
      expect(shouldRetry(0, httpError(status))).toBe(false);
    },
  );

  it.each([500, 502, 503, 504])(
    "retries %i, which is typically transient",
    (status) => {
      expect(shouldRetry(0, httpError(status))).toBe(true);
    },
  );

  it("retries a request that never reached the server", () => {
    // No `response` at all: a dropped connection, a network handover, or a
    // device waking from sleep. This is the case retrying actually exists for.
    expect(shouldRetry(0, new AxiosError("Network Error"))).toBe(true);
  });

  it("stops after the retry budget is exhausted", () => {
    expect(shouldRetry(1, httpError(500))).toBe(true);
    expect(shouldRetry(2, httpError(500))).toBe(false);
    expect(shouldRetry(3, httpError(500))).toBe(false);
  });

  it("does not retry a terminal status even on the first failure", () => {
    // Guards against a future change that gates the status check behind the
    // failure count and so grants every error one free retry.
    expect(shouldRetry(0, httpError(401))).toBe(false);
  });

  it("retries a non-Axios throw rather than treating it as terminal", () => {
    expect(shouldRetry(0, new Error("boom"))).toBe(true);
  });

  it("does not retry 429 because the server has already asked this client to slow down", () => {
    expect(shouldRetry(0, httpError(429))).toBe(false);
  });
});
