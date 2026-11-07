import React from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

import { ErrorBoundary } from "./ErrorBoundary";

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("render exploded");
  }

  return <Text>content</Text>;
}

/**
 * The app previously had no error boundary anywhere.
 *
 * React unmounts the whole tree when a render throws uncaught, so a single bad
 * screen produced a blank app with no navigation, no retry and no way to reach
 * sign-out. The user's only option was to force-quit, and if the throw happened
 * on a screen reached at launch, the app looked permanently broken. For a user
 * partway through filing against a deadline, that is data loss in practice even
 * when nothing was actually lost.
 */
describe("ErrorBoundary", () => {
  // React logs caught render errors to console.error; silence it so a passing
  // run is not full of alarming output.
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("renders children when nothing throws", async () => {
    const view = await render(
      <ErrorBoundary boundaryName="test">
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(view.getByText("content")).toBeTruthy();
  });

  it("shows a recovery screen instead of unmounting the tree", async () => {
    const view = await render(
      <ErrorBoundary boundaryName="test">
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(view.getByText("Something went wrong")).toBeTruthy();
    expect(view.getByText("Try again")).toBeTruthy();
  });

  it("reassures the user that their data survived", async () => {
    const view = await render(
      <ErrorBoundary boundaryName="test">
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(
      view.getByText("This screen could not be displayed. Your data has not been lost."),
    ).toBeTruthy();
  });

  it("reports the error to the crash-reporter hook with its boundary name", async () => {
    const onError = jest.fn();

    await render(
      <ErrorBoundary boundaryName="workspace-tasks" onError={onError}>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe("render exploded");
  });

  it("recovers when the user retries and the cause has cleared", async () => {
    let shouldThrow = true;

    function Subject() {
      return <Boom shouldThrow={shouldThrow} />;
    }

    const view = await render(
      <ErrorBoundary boundaryName="test">
        <Subject />
      </ErrorBoundary>,
    );

    expect(view.getByText("Something went wrong")).toBeTruthy();

    shouldThrow = false;
    await fireEvent.press(view.getByText("Try again"));

    expect(view.getByText("content")).toBeTruthy();
  });

  it("uses a supplied fallback in place of the default screen", async () => {
    // The global chrome boundary renders nothing on failure, so a broken toast
    // host cannot obscure the screen underneath it.
    const view = await render(
      <ErrorBoundary boundaryName="chrome" fallback={() => null}>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(view.queryByText("Something went wrong")).toBeNull();
  });

  it("hands the fallback a reset function that clears the error", async () => {
    const view = await render(
      <ErrorBoundary
        boundaryName="test"
        fallback={(_error, reset) => <Text onPress={reset}>custom retry</Text>}
      >
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(view.getByText("content")).toBeTruthy();
  });

  it("does not catch errors thrown outside its own subtree", async () => {
    // A boundary that swallowed sibling errors would mask failures it has no
    // business reporting.
    const onError = jest.fn();

    await render(
      <ErrorBoundary boundaryName="test" onError={onError}>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(onError).not.toHaveBeenCalled();
  });
});
