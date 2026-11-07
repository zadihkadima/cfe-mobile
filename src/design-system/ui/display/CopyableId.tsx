import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import * as Clipboard from "expo-clipboard";
import { Check, Copy } from "lucide-react-native";

import { formatShortId } from "@/shared/lib/shortId";

import { Icon } from "./Icon";

/**
 * How long the confirmation stays up after a copy.
 *
 * Long enough to be seen if you looked away for a moment, short enough that
 * the control is back to its resting state before anyone would think to press
 * it again.
 */
const COPIED_FEEDBACK_MS = 2000;

/**
 * A fixed-width family, chosen per platform because there is no portable name.
 *
 * Hex runs together in a proportional face: `1` and `l` sit at different
 * widths, and comparing two identifiers means matching characters by eye down
 * a ragged column. Android resolves the generic `monospace`; iOS does not, and
 * silently falls back to the system face, so it is named outright.
 */
const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

type Props = {
  /** The full identifier. Shortened for display, copied whole. */
  id: string | null | undefined;

  /**
   * What the identifier refers to, for the screen reader.
   *
   * A label reading "copy identifier" is no use on a screen carrying several.
   * Passing "task" turns it into "task identifier ... copy", which is the
   * difference between a usable control and one that has to be found by trial.
   */
  label?: string;

  className?: string;
};

/**
 * An identifier shown short and copied whole.
 *
 * Identifiers were not displayed anywhere before this. They exist in the URL
 * and the database, so the way to quote one in a message or a support request
 * was to open the record, read the address bar if there was one, and retype
 * twenty-four characters. In practice people described records by name, which
 * is ambiguous for anything the client has created twice.
 *
 * The short form is for recognising and reading out. The copy is the real
 * value: anything that acts on an identifier -- a lookup, a link, a report --
 * needs all of it, and shortened forms can coincide. See `shortId` for why the
 * displayed characters are taken from the end.
 */
export function CopyableId({ id, label, className }: Props) {
  // Which identifier was copied, rather than whether one was.
  //
  // The obvious shape is a boolean reset by an effect watching `id`, and it is
  // wrong twice over: it renders once with a tick against the new record
  // before the effect clears it, and it makes the component's state something
  // that has to be corrected after the fact rather than something that follows
  // from its props. Comparing against `id` leaves no window to be wrong in.
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copied = copiedId !== null && copiedId === id;

  // Held so the timer can be cleared on unmount and restarted on a second
  // press. Without this a quick second copy would be undone by the first
  // press's timer, putting the control back to rest while the confirmation
  // was still owed.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(() => {
    if (!id) return;

    // Deliberately not awaited at the call site. The confirmation is about
    // the press, and holding it back until the platform acknowledges the
    // write adds a delay with nothing to show for it.
    void (async () => {
      try {
        await Clipboard.setStringAsync(id);
      } catch {
        // Nothing useful to say. The clipboard is a platform service with no
        // failure the user can act on, and an alert here would be more
        // alarming than the missed copy it reports. The tick is withheld,
        // which is the honest signal: the control looks untouched, so the
        // natural response is to press it again.
        return;
      }

      setCopiedId(id);

      if (timer.current) clearTimeout(timer.current);

      timer.current = setTimeout(() => setCopiedId(null), COPIED_FEEDBACK_MS);
    })();
  }, [id]);

  // Nothing sensible to render, and a bare `#` would look like a record whose
  // identifier had gone missing rather than one that was never passed.
  if (!id) return null;

  const subject = label ? `${label} identifier` : "Identifier";

  return (
    <Pressable
      onPress={copy}
      accessibilityRole="button"
      // The full value is spoken, not the shortened one. A screen reader user
      // cannot glance at the field to fill in the rest, and eight characters
      // of hex is not something to be given half of.
      accessibilityLabel={
        copied ? `${subject} copied` : `${subject} ${id}. Copy`
      }
      accessibilityHint={copied ? undefined : "Copies the full identifier"}
      // Sized for the icon rather than the text, since the icon is what people
      // aim at and it is the smaller of the two.
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      className={className}
    >
      <View className="flex-row items-center">
        <Text
          style={{ fontFamily: MONO }}
          className="text-xs text-text-secondary dark:text-dark-text-secondary"
        >
          {formatShortId(id)}
        </Text>

        <View className="ml-1.5">
          {copied ? (
            <Icon as={Check} size="sm" tone="success" />
          ) : (
            <Icon as={Copy} size="sm" tone="muted" />
          )}
        </View>
      </View>
    </Pressable>
  );
}
