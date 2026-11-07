import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("states what is absent rather than that something is absent", async () => {
    const view = await render(
      <EmptyState
        title="No documents requested"
        description="Your accountant has not asked for anything yet."
      />,
    );

    expect(view.getByText("No documents requested")).toBeTruthy();
    expect(
      view.getByText("Your accountant has not asked for anything yet."),
    ).toBeTruthy();
  });

  it("offers the action that would fill the list", async () => {
    const onAction = jest.fn();

    const view = await render(
      <EmptyState
        title="No workspaces yet"
        actionLabel="Create workspace"
        onAction={onAction}
      />,
    );

    void fireEvent.press(view.getByText("Create workspace"));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("omits the action when there is nothing the user can do here", async () => {
    // A button with no handler is a dead control, and a dead control teaches
    // the user that controls in this app may not work.
    const view = await render(
      <EmptyState title="No activity" actionLabel="Do something" />,
    );

    expect(view.queryByText("Do something")).toBeNull();
  });
});
