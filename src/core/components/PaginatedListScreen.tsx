import React, { ReactElement, useState } from "react";

import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";

import { QueryState } from "@/core/components/QueryState";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";
import { PressableScale, SearchBar } from "@/design-system/ui";
import { Text } from "@/design-system/ui/typography/Text";
import { useTheme } from "@/design-system/theme/useTheme";

interface Page<T> {
  items: T[];
  total_pages: number;
}

interface Props<T> {

  title: string;

  /**
   * Called with the debounced search and the current page. The caller keeps
   * ownership of its own query hook, so this component never needs to know
   * which endpoint it is driving.
   *
   * Passing a hook as a prop is safe here, though it looks alarming and the
   * rules-of-hooks lint cannot verify it: the prop is a module-level function
   * fixed per call site, so it is invoked unconditionally and in the same
   * order on every render, which is the only thing those rules require. What
   * would break it is a caller passing a different hook depending on state —
   * so don't.
   */
  useData(params: { search: string; page: number }): {
    data?: Page<T>;
    isLoading: boolean;
    isError: boolean;
    error?: unknown;
    refetch(): void;
    isRefetching: boolean;
  };

  renderItem(item: T): ReactElement;

  keyExtractor(item: T): string;

  searchPlaceholder: string;

  /** Shown when the list is genuinely empty, not when a search found nothing. */
  emptyTitle: string;
  emptyDescription?: string;

  /**
   * A control rendered under the search field, such as a row of status tabs.
   *
   * Rendered by this component rather than by the caller above it so that it
   * sits inside the part of the screen that survives loading. Placed outside,
   * it would be torn down and rebuilt on every page turn along with the list.
   */
  filters?: ReactElement;

  /**
   * A value identifying the current filter selection.
   *
   * Whatever it is, changing it resets the page, for the same reason a new
   * search does: page three of "ongoing" is not page three of "cancelled", and
   * switching tabs while deep in a list otherwise answers with an empty screen
   * for a filter that has plenty of matches. The caller passes a string rather
   * than managing the reset itself so this stays in one place.
   */
  filterKey?: string;

  /** The floating action, omitted entirely when the viewer cannot create. */
  createLabel?: string;
  onCreate?(): void;

}

/**
 * The search-list-paginate screen, defined once.
 *
 * Three screens had implemented this independently, and all three carried the
 * same four defects — which is the argument for this component more than the
 * duplication itself. Each screen replaced its whole body while loading,
 * destroying the search field mid-keystroke; queried on every character rather
 * than debouncing; left the page number untouched when the search changed, so
 * refining a query while on page three returned nothing; and emptied the list
 * on every page turn, because a new query key has no cached entry.
 *
 * None of those are hard to fix. They recurred because each screen was written
 * by copying the last one, so a fix applied to one never reached the others.
 * Extracting the pattern is what makes the fix apply to all of them and to
 * whichever screen is written next.
 */
export function PaginatedListScreen<T>({

  title,

  useData,

  renderItem,

  keyExtractor,

  searchPlaceholder,

  emptyTitle,

  emptyDescription,

  filters,

  filterKey = "",

  createLabel,

  onCreate,

}: Props<T>) {

  const { theme } = useTheme();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const insets = useSafeAreaInsets();

  // Without this every keystroke is a request, and all but the last are stale
  // before they arrive.
  const debouncedSearch = useDebouncedValue(search, 300);

  // A new search against an old page number asks for page three of a result
  // set that may have one, and the user gets nothing for a query that matches.
  // Changing a filter does the same thing for the same reason, so the two are
  // tracked as one value: what page three means depends on both.
  //
  // Reset during render rather than in an effect. An effect runs *after* the
  // render that changed the search, so there was always one pass pairing the
  // new term with the stale page -- and because `useData` is a query hook
  // called during render, that pass issued a real request for a page that
  // usually does not exist. Its response could then land and paint an empty
  // list before the corrected request returned. Adjusting the state during
  // render is the supported way to do this: React discards the in-progress
  // output and re-renders immediately, so the stale pair never reaches a hook.
  const scope = `${filterKey}\u0000${debouncedSearch}`;

  const [lastScope, setLastScope] = useState(scope);

  if (lastScope !== scope) {
    setLastScope(scope);
    setPage(1);
  }

  const { data, isLoading, isError, error, refetch, isRefetching } = useData({
    search: debouncedSearch,
    page: lastScope === scope ? page : 1,
  });

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;
  const isSearching = debouncedSearch.trim().length > 0;

  return (
    <View className="flex-1 bg-background dark:bg-dark-background">

      <View className="gap-4 px-5 pb-4 pt-5">
        <Text variant="title">{title}</Text>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={searchPlaceholder}
          accessibilityLabel={searchPlaceholder}
        />

        {filters}
      </View>

      {/*
        Only the list is replaced while loading. The header above stays
        mounted, which is what keeps the search field alive and the keyboard up
        between keystrokes.
      */}
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={items.length === 0}
        emptyMessage={isSearching ? "No matches" : emptyTitle}
        emptyDescription={
          isSearching
            ? `Nothing matched "${debouncedSearch}". Try a shorter or different term.`
            : emptyDescription
        }
        // Offered only on a genuinely empty list. On an unmatched search the
        // useful action is to change the search, not to create a record the
        // user was not looking to create.
        emptyActionLabel={!isSearching ? createLabel : undefined}
        onEmptyAction={!isSearching ? onCreate : undefined}
        skeletonCount={6}
      >
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerClassName="pb-6"
          // Otherwise the first tap on a result only dismisses the keyboard,
          // and the user has to tap the same row twice.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ItemSeparatorComponent={() => (
            <View className="ml-4 h-px bg-divider dark:bg-dark-divider" />
          )}
          renderItem={({ item }) => renderItem(item)}
        />
      </QueryState>

      {/*
        Hidden on a single page: "1 / 1" with two dead controls costs vertical
        space to say nothing.
      */}
      {totalPages > 1 ? (
        <View
          className="flex-row items-center justify-between border-t border-border px-5 py-3 dark:border-dark-border"
          // The shell reserves the top inset but not the bottom one, so these
          // controls were sitting on the home indicator with their lower half
          // outside the touchable area -- "Next" looked like it simply did not
          // respond.
          style={{ paddingBottom: 12 + insets.bottom }}
        >
          <PagerButton
            label="Previous"
            disabled={page <= 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            icon={
              <ChevronLeft
                size={18}
                color={page <= 1 ? theme.colors.textMuted : theme.colors.primary}
              />
            }
          />

          <Text
            variant="caption"
            className="text-text-secondary dark:text-dark-text-secondary"
            accessibilityLabel={`Page ${page} of ${totalPages}`}
          >
            {page} / {totalPages}
          </Text>

          <PagerButton
            label="Next"
            disabled={page >= totalPages}
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            trailingIcon={
              <ChevronRight
                size={18}
                color={
                  page >= totalPages
                    ? theme.colors.textMuted
                    : theme.colors.primary
                }
              />
            }
          />
        </View>
      ) : null}

      {createLabel && onCreate ? (
        <PressableScale
          className="absolute right-6 h-14 w-14 items-center justify-center rounded-full bg-primary dark:bg-dark-primary"
          // Clears the gesture bar, and the pager bar when there is one.
          style={{ bottom: 24 + insets.bottom + (totalPages > 1 ? 48 : 0) }}
          onPress={onCreate}
          accessibilityRole="button"
          // A bare "+" is announced as "plus", leaving the user to guess what
          // it adds.
          accessibilityLabel={createLabel}
          scaleTo={0.9}
        >
          <Plus size={24} color={theme.colors.textInverted} />
        </PressableScale>
      ) : null}

    </View>
  );
}

function PagerButton({
  label,
  disabled,
  onPress,
  icon,
  trailingIcon,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}) {
  return (
    <PressableScale
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      // Announced as unavailable rather than only looking faded, so the state
      // exists for users who cannot see it.
      accessibilityState={{ disabled }}
      className="flex-row items-center gap-1 px-2 py-1"
    >
      {icon}

      <Text
        variant="label"
        className={
          disabled
            ? "text-text-muted dark:text-dark-text-muted"
            : "text-primary dark:text-dark-primary"
        }
      >
        {label}
      </Text>

      {trailingIcon}
    </PressableScale>
  );
}
