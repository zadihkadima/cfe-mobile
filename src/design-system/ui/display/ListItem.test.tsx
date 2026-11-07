import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { ListItem } from "./ListItem";

function renderItem(ui: React.ReactElement) {
  // No ThemeProvider on purpose. ListItem reads the palette for its chevron
  // colour, and rendering it bare asserts that the design system degrades to a
  // usable default outside a provider rather than crashing — which is the
  // situation any component finds itself in during an isolated test or a
  // storybook-style preview.
  return render(ui);
}

describe("ListItem", () => {
  it("keeps the title and subtitle to one line each", async () => {
    // Row height must not depend on content. Letting either wrap gives an
    // otherwise uniform list a ragged rhythm, and it costs a virtualised list
    // the constant row height it relies on to estimate scroll position.
    const view = await renderItem(
      <ListItem
        title="A title long enough that it would certainly wrap"
        subtitle="A subtitle that would also wrap given the chance"
      />,
    );

    expect(
      view.getByText("A title long enough that it would certainly wrap").props
        .numberOfLines,
    ).toBe(1);

    expect(
      view.getByText("A subtitle that would also wrap given the chance").props
        .numberOfLines,
    ).toBe(1);
  });

  it("reads the title and subtitle together to assistive technology", async () => {
    // Announced as one label rather than two nodes, so the row is heard as the
    // single thing it is rather than as unrelated fragments.
    const view = await renderItem(
      <ListItem
        title="Form 1099-NEC"
        subtitle="Requested 3 days ago"
        onPress={jest.fn()}
      />,
    );

    expect(view.getByLabelText("Form 1099-NEC. Requested 3 days ago")).toBeTruthy();
  });

  it("is not exposed as a button when it does nothing", async () => {
    // A row announced as pressable that ignores presses is worse than a plain
    // one: it invites an action that silently fails.
    const view = await renderItem(<ListItem title="Filed 2025 return" />);

    expect(view.queryByRole("button")).toBeNull();
  });

  it("calls onPress when the row is pressed", async () => {
    const onPress = jest.fn();

    const view = await renderItem(
      <ListItem title="Open workspace" onPress={onPress} />,
    );

    void fireEvent.press(view.getByLabelText("Open workspace"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
