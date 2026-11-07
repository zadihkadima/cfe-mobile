import { useState } from "react";
import { Pressable, View } from "react-native";

import { ChevronDown, Check } from "lucide-react-native";
import clsx from "clsx";

import { Text } from "../typography/Text";
import { Icon } from "../display/Icon";
import { BottomSheet } from "../feedback/BottomSheet";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  options: SelectOption<T>[];
  value: T;
  onChange(value: T): void;

  label?: string;

  /** Shown when the current value has no matching option, which should not happen. */
  placeholder?: string;

  accessibilityLabel?: string;
  className?: string;
}

/**
 * One choice from many, made in a sheet.
 *
 * The companion to `SegmentedControl`, which is right for two to four options
 * and wrong beyond that: the labels truncate and the control stops being
 * readable at exactly the point it has the most to say. This takes over there.
 *
 * Built on the sheet rather than on a floating panel anchored to the trigger.
 * An anchored menu has to decide whether to open upward or downward based on
 * where the trigger happens to sit, and gets it wrong near the bottom of the
 * screen, which is where a filter row usually is. The sheet arrives in the
 * same place every time and next to the thumb.
 *
 * The trigger states the current selection rather than the field's name. A
 * control reading "Type" tells you what it governs and not what it is doing,
 * which for a filter is the only question being asked of it.
 */
export function Select<T extends string>({
  options,
  value,
  onChange,
  label,
  placeholder = "Select",
  accessibilityLabel,
  className,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
    <View className={className}>
      {label ? (
        <Text className="mb-1 text-xs font-semibold text-text-secondary dark:text-dark-text-secondary">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label ?? "Select"}
        // Announced because the trigger's own text is the value, so without
        // this a screen reader gives the current selection and no indication
        // that it can be changed.
        accessibilityHint="Opens a list of options"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center justify-between rounded-lg border border-border px-3 py-2 dark:border-dark-border"
      >
        <Text
          numberOfLines={1}
          className="flex-1 pr-2 text-sm text-text dark:text-dark-text"
        >
          {selected?.label ?? placeholder}
        </Text>

        <Icon as={ChevronDown} size="sm" tone="muted" />
      </Pressable>

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        scrollable
      >
        <View>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                // The tick is the only visual marker of the current choice, so
                // it is stated here too. A reader that cannot see it would
                // otherwise hear twelve identical rows.
                accessibilityState={{ selected: isSelected }}
                className={clsx(
                  "flex-row items-center justify-between border-b border-border px-1 py-3 last:border-b-0 dark:border-dark-border",
                )}
              >
                <Text
                  className={clsx(
                    "flex-1 pr-2 text-sm",
                    isSelected
                      ? "font-semibold text-primary"
                      : "text-text dark:text-dark-text",
                  )}
                >
                  {option.label}
                </Text>

                {isSelected ? <Icon as={Check} size="sm" tone="primary" /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}
