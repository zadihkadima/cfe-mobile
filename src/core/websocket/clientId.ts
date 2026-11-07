let counter = 0;

/**
 * Produces an id used to correlate a message with the broadcast confirming it.
 *
 * This is not a UUID and does not need to be. It has to be unique within one
 * client's own session, because that is the only place it is ever compared:
 * the server echoes it back untouched and never stores it. Two clients
 * generating the same value cannot collide, since neither ever sees the
 * other's.
 *
 * The counter is included because `Date.now()` has millisecond resolution and
 * two messages can be sent inside the same millisecond — by a fast typist
 * hitting send twice, or by a retry firing alongside a fresh send. Two
 * messages sharing a correlation id would have the first confirmation resolve
 * both, leaving one permanently marked as sending.
 */
export function createClientId(): string {
  counter += 1;

  return `c${Date.now().toString(36)}-${counter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
