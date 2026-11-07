import React, { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { normalizeApiError } from "@/core/errors/normalizeApiError";
import { EmptyState, SkeletonList } from "@/design-system/ui";

type Props = {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;

  /** True when the request succeeded but returned nothing. */
  isEmpty?: boolean;

  /** Shown in place of the list when `isEmpty`. */
  emptyMessage?: string;

  /**
   * A supporting line under `emptyMessage`, and an action that would fill the
   * list. Both optional: a screen with nothing useful to offer is better off
   * saying less than inventing a control that leads nowhere.
   */
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;

  /**
   * Roughly how many rows this list shows when full, used to size the loading
   * placeholder. Getting it approximately right is what stops the screen
   * jumping when data lands.
   */
  skeletonCount?: number;

  /**
   * Refetch, wired to the retry control on the error state.
   *
   * The return type admits a promise because every caller passes react-query's
   * `refetch`, which returns one. Declaring this as `() => void` did not stop
   * that happening; it only meant the mismatch was invisible, and the promise
   * was discarded at the call site where a rejection had nowhere to go. The
   * component ignores the result deliberately — the query's own error state is
   * what drives this UI — so the discard is made explicit where it happens.
   */
  onRetry?: () => void | Promise<unknown>;

  /**
   * Omitted by detail screens, which use this component purely as an early
   * return guard and render their own body once the record has loaded.
   */
  children?: ReactNode;
};

/**
 * Renders the loading, error and empty states of a query-backed list.
 *
 * Every list screen in the app previously handled `isLoading` and then rendered
 * `data?.items ?? []`, with no branch for failure. That produces a specific and
 * dangerous falsehood: when the request fails, `data` is undefined, the list is
 * empty, and the screen confidently displays "No tasks yet."
 *
 * On a tax platform that is not a cosmetic defect. A user who opens their
 * outstanding document requests during a filing week, sees "nothing here", and
 * closes the app has been actively misinformed by a network error. Separating
 * "you have nothing outstanding" from "we could not reach the server" is the
 * entire point of this component, and it gives the user something to act on
 * rather than a dead end.
 */
export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty = false,
  emptyMessage = "Nothing here yet.",
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  skeletonCount = 5,
  onRetry,
  children,
}: Props) {
  if (isLoading) {
    // A placeholder in the shape of the list rather than a centred spinner.
    // The spinner said only that something was happening, occupied a different
    // amount of space than the content, and so guaranteed the screen jumped
    // the moment data arrived.
    return <SkeletonList count={skeletonCount} className="px-4 py-2" />;
  }

  if (isError) {
    // The normalised message is preferred over a raw exception string: it is
    // written for users, and it will not put an internal URL or a stack frame
    // on screen.
    const { message } = normalizeApiError(error);

    return (
      <View className="items-center justify-center gap-3 px-6 py-12">
        <Text className="text-center font-semibold text-text dark:text-dark-text">
          Could not load this list
        </Text>

        <Text className="text-center text-text-secondary dark:text-dark-text-secondary">
          {message}
        </Text>

        {onRetry ? (
          <Pressable
            className="mt-1 rounded-lg border border-primary px-4 py-2"
            onPress={() => void onRetry()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading"
          >
            <Text className="font-semibold text-primary">Try again</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyMessage}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return <>{children}</>;
}
