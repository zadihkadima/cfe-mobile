import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Calendar, X } from "lucide-react-native";

import { Icon } from "@/design-system/ui";

interface Props {
  label: string;
  /** `YYYY-MM-DD`, or empty for unset. Matches what `toApiDate` accepts. */
  value: string;
  onChange(value: string): void;
  placeholder?: string;
  minimumDate?: Date;
  error?: string;
  /** Marks the field clearable. Dates are usually optional, so this defaults on. */
  clearable?: boolean;
}

/**
 * Formats to `YYYY-MM-DD` from the *local* calendar fields.
 *
 * `toISOString()` would convert to UTC first, so a date picked late in the
 * evening anywhere west of Greenwich comes back as the following day. The user
 * picks a day on a calendar; the day they tapped is the day that must be sent.
 */
function toDateOnly(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses `YYYY-MM-DD` into a local-noon Date, or today when unset or invalid. */
function fromDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return new Date();
  }

  const [, year, month, day] = match;

  // Noon rather than midnight, so a daylight-saving shift cannot roll the
  // value back into the previous day.
  return new Date(Number(year), Number(month) - 1, Number(day), 12);
}

/** Renders the stored value the way a person reads a date. */
function formatForDisplay(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  return fromDateOnly(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * A date field backed by the platform picker.
 *
 * These dates were previously free-text inputs. A typed date is wrong in three
 * ways that a picker removes outright: the format is guessed (`15/03/2025` and
 * `2025-03-15` both look reasonable and only one parsed), impossible dates like
 * the 31st of February can be entered, and nothing stops a due date landing
 * before the start date until the server rejects the whole submission.
 *
 * The value stays a `YYYY-MM-DD` string rather than a `Date` so it continues to
 * flow through the existing `toApiDate` helper unchanged.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = "Select a date",
  minimumDate,
  error,
  clearable = true,
}: Props) {
  const [open, setOpen] = useState(false);

  const display = formatForDisplay(value);

  /**
   * Whether the native picker is actually in the running binary.
   *
   * `@react-native-community/datetimepicker` is a native module. Installing it
   * and reloading is not enough — the app has to be rebuilt, because Metro
   * ships JavaScript and cannot add native code to an already-built binary.
   * Until that rebuild happens the component mounts and renders nothing at
   * all, so tapping the field appears to do nothing whatsoever: no error, no
   * log, no picker. That is an expensive thing to debug, and the answer is not
   * discoverable from the symptom.
   */
  const pickerAvailable = DateTimePicker != null;

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    // Android renders a modal dialog that reports its own dismissal; iOS keeps
    // the picker inline and never sends this event. Closing on every event
    // would make the iOS spinner shut after a single scroll tick.
    if (Platform.OS === "android") {
      setOpen(false);
    }

    if (event.type === "dismissed" || !selected) {
      return;
    }

    onChange(toDateOnly(selected));
  }

  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
        {label}
      </Text>

      <View className="flex-row items-center">
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          // Without this a screen reader announces only the formatted date with
          // no indication of which field it belongs to, and an unset field is
          // announced as the placeholder alone.
          accessibilityLabel={`${label}. ${display ?? "Not set"}`}
          accessibilityHint="Opens a date picker"
          className={`flex-1 flex-row items-center rounded-lg border px-3 py-3 ${
            error ? "border-danger dark:border-dark-danger" : "border-border dark:border-dark-border"
          }`}
        >
          <Icon as={Calendar} size="sm" />

          <Text
            className={`ml-2 flex-1 ${
              display
                ? "text-text dark:text-dark-text"
                : "text-text-secondary dark:text-dark-text-secondary"
            }`}
          >
            {display ?? placeholder}
          </Text>
        </Pressable>

        {clearable && display ? (
          <Pressable
            onPress={() => onChange("")}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            hitSlop={8}
            className="ml-2 rounded-full p-2"
          >
            <Icon as={X} size="sm" tone="secondary" />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text className="mt-1 text-sm font-medium text-danger dark:text-dark-danger">{error}</Text>
      ) : null}

      {open ? (
        pickerAvailable ? (
          <DateTimePicker
            value={fromDateOnly(value)}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            minimumDate={minimumDate}
            onChange={handleChange}
          />
        ) : (
          // Says what is wrong instead of rendering nothing. Silence here is
          // indistinguishable from a dead button, and sends whoever hits it
          // looking for a bug in this component rather than at their build.
          <Text className="mt-2 text-sm font-medium text-danger dark:text-dark-danger">
            The date picker is missing from this build. Rebuild the app
            (`npx expo run:android` or `run:ios`) — a JavaScript reload cannot
            add a native module.
          </Text>
        )
      ) : null}

      {/* iOS keeps the picker on screen until it is dismissed explicitly. */}
      {open && pickerAvailable && Platform.OS === "ios" ? (
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          className="mt-2 items-center rounded-lg bg-primary px-3 py-2 dark:bg-dark-primary"
        >
          <Text className="font-semibold text-white">Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
