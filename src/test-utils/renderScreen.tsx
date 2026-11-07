import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, type RenderOptions } from "@testing-library/react-native";
import { SafeAreaProvider, type Metrics } from "react-native-safe-area-context";

import authReducer from "@/core/store/authSlice";
import workspaceReducer from "@/core/store/workspaceSlice";
import notificationReducer from "@/core/store/notificationSlice";

/**
 * Test rendering helpers for screens.
 *
 * Screens are useless without their providers: a screen that calls a TanStack
 * Query hook throws without a `QueryClientProvider`, and one that dispatches
 * throws without a store. Repeating that scaffolding in every test file invites
 * each file to configure it slightly differently, and the differences are
 * exactly the kind that make one suite pass and another flake.
 */

/**
 * A store built fresh for each test.
 *
 * The application's singleton store is deliberately *not* reused. It is module
 * state, so one test signing a user in would leak that session into every test
 * that ran afterwards, and the suite would start depending on file ordering —
 * the failure mode that is hardest to diagnose because the failing test is
 * never the broken one.
 */
const testReducer = {
  auth: authReducer,
  workspace: workspaceReducer,
  notification: notificationReducer,
};

/** The shape a test may preload, derived from the reducers rather than restated. */
export type TestState = {
  auth: ReturnType<typeof authReducer>;
  workspace: ReturnType<typeof workspaceReducer>;
  notification: ReturnType<typeof notificationReducer>;
};

/**
 * A store built fresh for each test.
 *
 * The application's singleton store is deliberately *not* reused. It is module
 * state, so one test signing a user in would leak that session into every test
 * that ran afterwards, and the suite would start depending on file ordering —
 * the failure mode that is hardest to diagnose because the failing test is
 * never the broken one.
 */
export function makeTestStore(preloadedState?: Partial<TestState>) {
  return configureStore({
    reducer: testReducer,
    ...(preloadedState ? { preloadedState: preloadedState as TestState } : {}),
  });
}

/**
 * A query client configured for determinism rather than for production
 * behaviour.
 *
 * `retry: false` matters most. The real client retries failed reads, so a test
 * asserting on an error state would otherwise wait through the retry schedule
 * and time out — and would report "unable to find text" rather than "the
 * request failed", pointing the reader at the wrong problem entirely.
 *
 * `gcTime: Infinity` stops the cache being collected mid-assertion, which
 * produces failures that reproduce only under load.
 */
export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
    // Query errors are expected in tests that assert on error states; retries
    // are disabled above so those errors surface immediately rather than after
    // the retry schedule has elapsed.
  });
}

/**
 * Fixed safe-area metrics, standing in for the device.
 *
 * Without a `SafeAreaProvider` in the tree, `useSafeAreaInsets` throws rather
 * than returning zeroes — so before this was added, *no* screen that respects
 * the notch or the gesture bar could be rendered in a test at all. That is a
 * large share of the app's screens, and it is a significant part of why so few
 * of them were covered: the harness refused them, and the refusal looked like
 * a problem with the screen.
 *
 * The values are supplied rather than zeroed because several screens position
 * controls against the bottom inset. Zero insets would let a control that sits
 * under the home indicator on a real handset pass its test.
 */
const TEST_INSETS: Metrics = {
  insets: { top: 47, bottom: 34, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

export interface RenderScreenOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<TestState>;
  queryClient?: QueryClient;
}

/**
 * Renders a screen inside the providers it needs, and returns the store and
 * query client so a test can assert on state the UI does not display.
 *
 * **Must be awaited.** `render` is asynchronous in Testing Library v14, which
 * is a genuine trap: forgetting the `await` does not fail where you forgot it.
 * The render silently never completes, `screen` is never populated, and every
 * query then fails with "`render` function has not been called" — an error that
 * accuses the test of omitting the one thing it plainly did.
 */
export async function renderScreen(
  ui: ReactElement,
  { preloadedState, queryClient, ...options }: RenderScreenOptions = {},
) {
  const store = makeTestStore(preloadedState);
  const client = queryClient ?? makeTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <SafeAreaProvider initialMetrics={TEST_INSETS}>{children}</SafeAreaProvider>
        </QueryClientProvider>
      </Provider>
    );
  }

  const result = await render(ui, { wrapper: Wrapper, ...options });

  return { store, queryClient: client, ...result };
}

/**
 * `screen`, `fireEvent` and `waitFor` are deliberately not re-exported here.
 *
 * Importing them straight from `@testing-library/react-native` keeps it obvious
 * that they are the library's own API and that `fireEvent` — like `render` —
 * returns a promise in v14 and must be awaited.
 */
