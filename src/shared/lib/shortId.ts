/**
 * How many characters of an identifier are shown.
 *
 * Eight is enough to tell apart the records anyone holds in their head at
 * once, and short enough to read down a column or say out loud without
 * losing your place.
 */
export const SHORT_ID_LENGTH = 8;

/**
 * Shortens an identifier for display, keeping the end rather than the start.
 *
 * This looks backwards and is the whole point of the function, so it is worth
 * setting down why. Mongo's ObjectID is three fields laid end to end:
 *
 *     6a6ff86b  a989c46f37  17165e
 *     ^         ^           ^
 *     |         |           3-byte counter
 *     |         5-byte value, drawn once per server process
 *     4-byte timestamp, whole seconds
 *
 * Six identifiers made in a row come out like this:
 *
 *     6a6ff86ba989c46f3717165e
 *     6a6ff86ba989c46f3717165f
 *     6a6ff86ba989c46f37171660
 *
 * The first twenty-two characters are the same. The timestamp only moves once
 * a second, and the random field is fixed for the lifetime of the process, so
 * everything created by one server between restarts shares that prefix. Taking
 * the first eight characters -- the obvious reading of "shorten" -- would print
 * `6a6ff86b` against every row on the screen and be worse than showing
 * nothing, because it looks like an identifier while identifying nothing.
 *
 * The tail is the counter, which moves on every single insert. Eight characters
 * takes all six of it plus one byte of the per-process random field, so records
 * from either side of a restart stay distinguishable.
 *
 * The result is for recognising and reading aloud, not for keying. Counters
 * restart with the process, so two shortened ids can coincide. Anything acting
 * on an identifier must use the full one, which is why the component pairs this
 * with copying the whole value.
 */
export function shortId(id: string | null | undefined): string {
  if (!id) return "";

  const trimmed = id.trim();

  // Already short enough to show whole. Slicing regardless would be harmless
  // for ObjectIDs but this also takes sequential ids and test fixtures, where
  // cutting a four-character id to its last eight is a no-op worth stating.
  if (trimmed.length <= SHORT_ID_LENGTH) return trimmed;

  return trimmed.slice(-SHORT_ID_LENGTH);
}

/**
 * The shortened identifier with the marker used wherever one is displayed.
 *
 * Bare hex reads as a stray word in a sentence. The prefix says the characters
 * after it are a reference and not a quantity or a code the reader is meant to
 * recognise.
 */
export function formatShortId(id: string | null | undefined): string {
  const short = shortId(id);

  return short ? `#${short}` : "";
}
