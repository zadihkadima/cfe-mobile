import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("does not correct or capitalise what the user types", async () => {
    // Both default to on and both are actively wrong here. The keyboard
    // capitalises a surname mid-query and autocorrects surnames and reference
    // numbers into ordinary words, so the search looks for something the user
    // did not type. On a platform where people search for names and tax
    // identifiers that is a correctness problem, not an annoyance.
    const view = await render(
      <SearchBar value="" onChangeText={jest.fn()} placeholder="Search" />,
    );

    const input = view.getByLabelText("Search");

    expect(input.props.autoCorrect).toBe(false);
    expect(input.props.autoCapitalize).toBe("none");
  });

  it("offers a way to clear only when there is something to clear", async () => {
    const empty = await render(
      <SearchBar value="" onChangeText={jest.fn()} />,
    );

    // A permanently visible clear button on an empty field is a dead control.
    expect(empty.queryByLabelText("Clear search")).toBeNull();

    const filled = await render(
      <SearchBar value="acme" onChangeText={jest.fn()} />,
    );

    expect(filled.getByLabelText("Clear search")).toBeTruthy();
  });

  it("empties the field when cleared", async () => {
    // Without this, emptying a search means holding backspace, which is slow
    // enough on a phone that users navigate away instead.
    const onChangeText = jest.fn();

    const view = await render(
      <SearchBar value="acme" onChangeText={onChangeText} />,
    );

    void fireEvent.press(view.getByLabelText("Clear search"));

    expect(onChangeText).toHaveBeenCalledWith("");
  });

  it("stays labelled once the placeholder disappears", async () => {
    // A screen reader otherwise has nothing to announce for the field at
    // exactly the moment it is being used.
    const view = await render(
      <SearchBar
        value="acme"
        onChangeText={jest.fn()}
        placeholder="Search"
        accessibilityLabel="Search workspaces"
      />,
    );

    expect(view.getByLabelText("Search workspaces")).toBeTruthy();
  });
});
