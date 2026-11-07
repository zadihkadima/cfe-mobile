import { Message } from "../api/types";

type Reader = NonNullable<Message["seen_by"]>[number];

/**
 * How many readers to name before summarising the rest.
 *
 * Past a few, the line stops being scannable and becomes a paragraph — which
 * is also roughly the point at which "everyone has read it" is the real
 * answer and the individual names stop mattering.
 */
const NAMES_SHOWN = 3;

/**
 * Describes who has read a message.
 *
 * A count alone is not much use in a group conversation: "seen by 2" of four
 * participants leaves the only question worth asking — which two — unanswered.
 *
 * `count` is used as a fallback rather than derived from `readers`, because a
 * backend that has not been redeployed sends the count and no names at all.
 * Degrading to the previous display is much better than degrading to a blank
 * line, and much better than claiming nobody has read it.
 */
export function describeReaders(
  readers: Reader[] | undefined,
  count: number,
): string {
  const names = (readers ?? [])
    .map((reader) => reader.name)
    .filter((name): name is string => !!name && name.trim().length > 0);

  if (names.length === 0) {
    return `Seen by ${count}`;
  }

  if (names.length <= NAMES_SHOWN) {
    return `Seen by ${names.join(", ")}`;
  }

  return `Seen by ${names.slice(0, NAMES_SHOWN).join(", ")} and ${
    names.length - NAMES_SHOWN
  } more`;
}
