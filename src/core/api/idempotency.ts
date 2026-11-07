/**
 * Idempotency key generation for retry-safe mutations.
 *
 * The backend guarantees at most one execution per `Idempotency-Key` on POST.
 * The value of that guarantee depends entirely on the client generating one key
 * per *logical operation* and reusing it across every retry of that operation.
 * A key generated per HTTP attempt provides no protection at all, which is the
 * mistake this module exists to make hard to commit.
 *
 * The keys are not cryptographically random, and do not need to be. The server
 * scopes every key to the authenticated user and the route, so a key guessed by
 * another account resolves to a different namespace and discloses nothing. The
 * only requirement here is uniqueness within one user's traffic, which the
 * combination of a timestamp, a process-local counter and randomness satisfies
 * comfortably. Depending on a native crypto module for this would add a
 * dependency without adding safety.
 */

/**
 * Monotonic within a process, so two keys minted in the same millisecond cannot
 * collide even if the random component happens to repeat.
 */
let counter = 0;

function randomSegment(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Creates a key for a single logical operation. */
export function newIdempotencyKey(): string {
  counter += 1;

  return [
    Date.now().toString(36),
    counter.toString(36),
    randomSegment(),
    randomSegment(),
  ].join("-");
}

/** The header the backend reads. */
export const IDEMPOTENCY_HEADER = "Idempotency-Key";

/**
 * Builds request config carrying an idempotency key.
 *
 * Intended to be called once, outside the retry loop:
 *
 * ```ts
 * const config = withIdempotencyKey();
 *
 * useMutation({
 *   mutationFn: (input) => api.post("/submissions", input, config),
 * });
 * ```
 *
 * Capturing the config before the mutation runs is what makes every retry of
 * that mutation carry the same key. Calling it inside `mutationFn` would mint a
 * fresh key per attempt and silently defeat the mechanism.
 */
export function withIdempotencyKey(key: string = newIdempotencyKey()) {
  return {
    headers: {
      [IDEMPOTENCY_HEADER]: key,
    },
  };
}
