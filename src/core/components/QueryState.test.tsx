import React from "react";
import { Text } from "react-native";
import { AxiosError } from "axios";
import { fireEvent, render } from "@testing-library/react-native";

import { QueryState } from "./QueryState";

function httpError(status: number, body?: unknown): AxiosError {
  const error = new AxiosError("Request failed");
  error.response = {
    status,
    statusText: "",
    data: body ?? {},
    headers: {},
    config: {} as never,
  };
  return error;
}

/**
 * Every list screen in this app used to render `data?.items ?? []` with no
 * branch for failure, so a failed request produced an empty array and the
 * screen displayed "No tasks yet."
 *
 * On a tax platform that is a correctness bug, not a cosmetic one: a client who
 * checks their outstanding document requests during a filing week and is told
 * there is nothing outstanding has been misinformed by a network error. The
 * first test below is the one that matters — it asserts that a failure is never
 * presented as emptiness.
 */
describe("QueryState", () => {
  it("never shows the empty message when the request failed", async () => {
    const view = await render(
      <QueryState
        isLoading={false}
        isError
        error={httpError(500)}
        isEmpty
        emptyMessage="No tasks yet."
      >
        <Text>rows</Text>
      </QueryState>,
    );

    expect(view.queryByText("No tasks yet.")).toBeNull();
    expect(view.getByText("Could not load this list")).toBeTruthy();
  });

  it("does not render children when the request failed", async () => {
    // Otherwise a screen could show a partial or stale list beneath an error.
    const view = await render(
      <QueryState isLoading={false} isError error={httpError(503)}>
        <Text>rows</Text>
      </QueryState>,
    );

    expect(view.queryByText("rows")).toBeNull();
  });

  it("shows a safe permission message instead of the server's authorization detail", async () => {
    const view = await render(
      <QueryState
        isLoading={false}
        isError
        error={httpError(403, { error: "You are not a member of this workspace" })}
      >
        <Text>rows</Text>
      </QueryState>,
    );

    expect(view.getByText("You do not have permission to do this action.")).toBeTruthy();
    expect(view.queryByText("You are not a member of this workspace")).toBeNull();
  });

  it("offers a retry that calls refetch", async () => {
    const onRetry = jest.fn();

    const view = await render(
      <QueryState
        isLoading={false}
        isError
        error={httpError(500)}
        onRetry={onRetry}
      >
        <Text>rows</Text>
      </QueryState>,
    );

    void fireEvent.press(view.getByText("Try again"));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("omits the retry control when no refetch was supplied", async () => {
    // A button that does nothing is worse than no button.
    const view = await render(
      <QueryState isLoading={false} isError error={httpError(500)}>
        <Text>rows</Text>
      </QueryState>,
    );

    expect(view.queryByText("Try again")).toBeNull();
  });

  it("shows the empty message only on a successful empty result", async () => {
    const view = await render(
      <QueryState
        isLoading={false}
        isError={false}
        isEmpty
        emptyMessage="No tasks yet."
      >
        <Text>rows</Text>
      </QueryState>,
    );

    expect(view.getByText("No tasks yet.")).toBeTruthy();
    expect(view.queryByText("rows")).toBeNull();
  });

  it("renders children when the request succeeded with data", async () => {
    const view = await render(
      <QueryState isLoading={false} isError={false} isEmpty={false}>
        <Text>rows</Text>
      </QueryState>,
    );

    expect(view.getByText("rows")).toBeTruthy();
  });

  it("prefers the loading state over every other state", async () => {
    // While a refetch is in flight the previous error must not linger, or a
    // retry appears to do nothing.
    const view = await render(
      <QueryState isLoading isError error={httpError(500)} isEmpty>
        <Text>rows</Text>
      </QueryState>,
    );

    expect(view.queryByText("Could not load this list")).toBeNull();
    expect(view.queryByText("rows")).toBeNull();
  });

  it("explains a network failure that never reached the server", async () => {
    const view = await render(
      <QueryState isLoading={false} isError error={new Error("Network Error")}>
        <Text>rows</Text>
      </QueryState>,
    );

    expect(view.getByText("Could not load this list")).toBeTruthy();
  });

  it("exposes the retry control to assistive technology", async () => {
    const view = await render(
      <QueryState
        isLoading={false}
        isError
        error={httpError(500)}
        onRetry={jest.fn()}
      >
        <Text>rows</Text>
      </QueryState>,
    );

    expect(view.getByLabelText("Retry loading")).toBeTruthy();
  });
});
