import React from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ThemedTextInput as TextInput } from "@/core/components/ThemedTextInput";

type Props<T> = {
  label: string;

  value?: T | null;

  search: string;

  onSearchChange: (
    text: string
  ) => void;

  items: T[];

  loading?: boolean;

  getKey: (
    item: T
  ) => string;

  getLabel: (
    item: T
  ) => string;

  getSubtitle?: (
    item: T
  ) => string;

  onSelect: (
    item: T
  ) => void;

  placeholder?: string;
};

export function SearchSelect<T>({
  label,
  value,
  search,
  onSearchChange,
  items,
  loading,
  getKey,
  getLabel,
  getSubtitle,
  onSelect,
  placeholder,
}: Props<T>) {
  return (
    <View className="mb-6">
      <Text className="text-base font-semibold mb-2 text-text dark:text-dark-text">
        {label}
      </Text>

      {value && (
        <View className="mb-4 rounded-lg border border-border bg-surface/50 p-3 dark:border-dark-border dark:bg-dark-surface/50">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary">
            Assigned {label.toLowerCase()}
          </Text>
          <Text className="font-bold text-text dark:text-dark-text">{getLabel(value)}</Text>

          {getSubtitle && (
            <Text className="text-text-secondary dark:text-dark-text-secondary">
              {getSubtitle(value)}
            </Text>
          )}
        </View>
      )}

      <TextInput
        className="border border-border dark:border-dark-border rounded-lg p-3 mb-3 bg-surface dark:bg-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary"
        placeholder={placeholder ?? `Search ${label}...`}
        value={search}
        onChangeText={onSearchChange}
      />

      {loading && (
        <ActivityIndicator
          className="mb-3"
        />
      )}

      {/*
        Mapped rather than virtualised, inside a bounded box.

        This is a picker sitting in the middle of a form, so the form has to be
        able to scroll around it -- and a FlatList inside a ScrollView loses
        virtualisation anyway while also producing React Native's
        "VirtualizedLists should never be nested" warning. What it renders is a
        page of search results, not an unbounded feed, so there is nothing for
        virtualisation to save here. The height cap is what stops the results
        pushing the rest of the form off the screen.
      */}
      <View className="max-h-64">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-dark-text-secondary">
          Available {label.toLowerCase()}s
        </Text>
        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {items.filter((item) => getKey(item) !== (value ? getKey(value) : "")).map((item) => (
            <TouchableOpacity
              key={getKey(item)}
              className="py-3 border-b border-border dark:border-dark-border"
              onPress={() =>
                onSelect(item)
              }
            >
              <Text className="font-semibold text-text dark:text-dark-text">
                {getLabel(item)}
              </Text>

              {getSubtitle && (
                <Text
                  className="text-text-secondary dark:text-dark-text-secondary"
                >
                  {getSubtitle(item)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          {!loading && items.filter((item) => getKey(item) !== (value ? getKey(value) : "")).length === 0 ? (
            <Text className="py-3 text-sm text-text-secondary dark:text-dark-text-secondary">
              No available {label.toLowerCase()}s found.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}