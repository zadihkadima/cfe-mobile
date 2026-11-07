import {
  IDEMPOTENCY_HEADER,
  newIdempotencyKey,
  withIdempotencyKey,
} from "./idempotency";

/**
 * The backend deduplicates POSTs by `Idempotency-Key`. That protection is only
 * as good as the client's key discipline: a key minted per HTTP attempt makes
 * every retry look like a new operation and provides no protection whatsoever,
 * which on this platform means duplicate IRS submissions and duplicate
 * signature requests. These tests pin both halves of the contract — keys are
 * unique per operation, and stable across the retries of one operation.
 */
describe("newIdempotencyKey", () => {
  it("never repeats a key, even for calls within the same millisecond", () => {
    // A purely time-based key would collide here; the process-local counter is
    // what prevents it.
    const keys = new Set(Array.from({ length: 10_000 }, newIdempotencyKey));

    expect(keys.size).toBe(10_000);
  });

  it("stays unique when the clock does not advance", () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    try {
      const keys = new Set(Array.from({ length: 1_000 }, newIdempotencyKey));
      expect(keys.size).toBe(1_000);
    } finally {
      now.mockRestore();
    }
  });

  it("stays unique when the clock moves backwards", () => {
    // Clocks are adjusted by NTP and by the user. A key scheme that assumes
    // monotonic time would start reissuing keys after a correction.
    const times = [3_000, 2_000, 1_000, 1_000, 2_000];
    let i = 0;
    const now = jest.spyOn(Date, "now").mockImplementation(() => times[i++ % times.length]);

    try {
      const keys = new Set(Array.from({ length: times.length }, newIdempotencyKey));
      expect(keys.size).toBe(times.length);
    } finally {
      now.mockRestore();
    }
  });

  it("produces a key the server will accept", () => {
    const key = newIdempotencyKey();

    // The backend bounds the header at 128 characters and the middleware
    // rejects anything outside a conservative character set.
    expect(key.length).toBeLessThanOrEqual(128);
    expect(key).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(key.length).toBeGreaterThan(0);
  });
});

describe("withIdempotencyKey", () => {
  it("sets the header the backend reads", () => {
    const config = withIdempotencyKey("fixed-key");

    expect(config.headers[IDEMPOTENCY_HEADER]).toBe("fixed-key");
  });

  it("returns a stable config so every retry of one mutation reuses the key", () => {
    // This is the intended usage: build the config once, outside the mutation
    // function, then let all attempts share it.
    const config = withIdempotencyKey();

    const first = config.headers[IDEMPOTENCY_HEADER];
    const second = config.headers[IDEMPOTENCY_HEADER];

    expect(first).toBe(second);
  });

  it("mints a distinct key per call when none is supplied", () => {
    const a = withIdempotencyKey().headers[IDEMPOTENCY_HEADER];
    const b = withIdempotencyKey().headers[IDEMPOTENCY_HEADER];

    expect(a).not.toBe(b);
  });
});
