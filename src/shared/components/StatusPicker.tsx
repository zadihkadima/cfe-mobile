import { Pressable, Text, View } from "react-native";

import {
  describePriority,
  describeStatus,
  WORK_PRIORITIES,
  WORK_STATUSES,
} from "@/shared/lib/workStatus";

interface SegmentedProps {
  label: string;
  options: readonly string[];
  describe(value: string): string;
  value: string;
  onChange(value: string): void;
}

/**
 * A row of mutually exclusive choices.
 *
 * Used rather than a dropdown because these vocabularies are three or four
 * short words: the current value should be readable without a tap, and the
 * alternatives without a modal.
 */
function Segmented({ label, options, describe, value, onChange }: SegmentedProps) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
        {label}
      </Text>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        className="flex-row overflow-hidden rounded-lg border border-border dark:border-dark-border"
      >
        {options.map((option, index) => {
          const selected = value === option;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={describe(option)}
              className={`flex-1 items-center px-2 py-2 ${
                index > 0 ? "border-l border-border dark:border-dark-border" : ""
              } ${selected ? "bg-primary" : ""}`}
            >
              <Text
                className={`text-center text-xs ${
                  selected
                    ? "font-semibold text-white"
                    : "text-text-secondary dark:text-dark-text-secondary"
                }`}
              >
                {describe(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Chooses the state a task or checklist is in.
 *
 * Status could previously only be changed through the list's overflow menu,
 * which offered "Mark completed" and "Cancel" and nothing else -- so there was
 * no way to record that work had started, and no way back from either
 * terminal state.
 */
export function StatusPicker({
  label = "Status",
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange(value: string): void;
}) {
  return (
    <Segmented
      label={label}
      options={WORK_STATUSES}
      describe={describeStatus}
      value={value}
      onChange={onChange}
    />
  );
}

/**
 * Chooses how urgent a task is.
 *
 * Previously a free-text box, so "Hgh" and "urgent" were both accepted by the
 * form and neither sorted, filtered nor coloured as intended. The server now
 * rejects them, which without this would turn a typo into a failed save with
 * no field to point at.
 */
export function PriorityPicker({
  label = "Priority",
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange(value: string): void;
}) {
  return (
    <Segmented
      label={label}
      options={WORK_PRIORITIES}
      describe={describePriority}
      value={value}
      onChange={onChange}
    />
  );
}
