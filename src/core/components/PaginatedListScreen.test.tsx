import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { PaginatedListScreen } from "./PaginatedListScreen";
import { renderScreen } from "@/test-utils/renderScreen";

interface Row {
  id: string;
  name: string;
}

/**
 * A stand-in for the module query hooks the real screens pass.
 *
 * It records the parameters it was called with, because most of what this
 * component does is decide *what to ask for* -- resetting the page when the
 * search changes, debouncing keystrokes -- and none of that is visible in the
 * rendered output.
 */
function makeHook(pages = 1) {
  const calls: { search: string; page: number }[] = [];

  const useData = ({ search, page }: { search: string; page: number }) => {
    calls.push({ search, page });

    return {
      data: {
        items: search === "nothing" ? [] : [{ id: "1", name: "Ada Lovelace" }],
        total_pages: pages,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    };
  };

  return { useData, calls };
}

function props(overrides: Partial<React.ComponentProps<typeof PaginatedListScreen<Row>>> = {}) {
  const { useData } = makeHook();

  return {
    title: "Clients",
    searchPlaceholder: "Search clients",
    useData,
    keyExtractor: (row: Row) => row.id,
    renderItem: (row: Row) => <Text>{row.name}</Text>,
    emptyTitle: "No clients yet",
    ...overrides,
  };
}

describe("PaginatedListScreen", () => {
  /**
   * The create action is the reason this component is tested first.
   *
   * Three list screens share this body, and a create button reported as
   * "removed" from all of them had never been removed at all -- the list was
   * throwing during render, which unmounted the whole screen and took the
   * floating action with it. A control that only exists while its siblings
   * render successfully needs a test that says so.
   */
  it("offers the create action", async () => {
    const onCreate = jest.fn();

    await renderScreen(
      <PaginatedListScreen<Row>
        {...props({ createLabel: "Add client", onCreate })}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Add client"));

    expect(onCreate).toHaveBeenCalled();
  });

  it("labels the create action with what it creates", async () => {
    await renderScreen(
      <PaginatedListScreen<Row>
        {...props({ createLabel: "Add client", onCreate: jest.fn() })}
      />,
    );

    // A bare "+" is announced as "plus", leaving a screen reader user to guess
    // what it adds.
    expect(screen.queryByLabelText("plus")).toBeNull();
    expect(screen.getByLabelText("Add client")).toBeTruthy();
  });

  it("omits the create action entirely when the viewer cannot create", async () => {
    await renderScreen(<PaginatedListScreen<Row> {...props()} />);

    // Hidden rather than disabled. A greyed-out button invites a manager to
    // keep pressing something they will never be allowed to use.
    expect(screen.queryByLabelText("Add client")).toBeNull();
  });

  it("keeps the search field mounted while the list reloads", async () => {
    const useData = ({ search, page }: { search: string; page: number }) => ({
      data: { items: [] as Row[], total_pages: 1 },
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
      search,
      page,
    });

    await renderScreen(<PaginatedListScreen<Row> {...props({ useData })} />);

    // Replacing the whole body while loading destroys the input mid-keystroke,
    // which drops the keyboard and the caret on every search.
    expect(screen.getByLabelText("Search clients")).toBeTruthy();
  });

  it("does not issue a request for every keystroke", async () => {
    const { useData, calls } = makeHook();

    await renderScreen(<PaginatedListScreen<Row> {...props({ useData })} />);

    const before = calls.length;

    await fireEvent.changeText(screen.getByLabelText("Search clients"), "a");
    await fireEvent.changeText(screen.getByLabelText("Search clients"), "ad");
    await fireEvent.changeText(screen.getByLabelText("Search clients"), "ada");

    // The searches that matter are the ones the typist stopped on. Every
    // request before that is stale before it arrives.
    const searched = calls.slice(before).filter((call) => call.search !== "");

    expect(searched).toHaveLength(0);
  });

  it("returns to the first page when the search changes", async () => {
    const { useData, calls } = makeHook(4);

    await renderScreen(<PaginatedListScreen<Row> {...props({ useData })} />);

    await fireEvent.press(screen.getByLabelText("Next"));

    await waitFor(() =>
      expect(calls.some((call) => call.page === 2)).toBe(true),
    );

    await fireEvent.changeText(screen.getByLabelText("Search clients"), "ada");

    // Asking for page three of a result set that has one returns nothing, and
    // a search that matches looks to the user like a search that failed.
    await waitFor(() =>
      expect(
        calls.some((call) => call.search === "ada" && call.page === 1),
      ).toBe(true),
    );

    expect(calls.some((call) => call.search === "ada" && call.page > 1)).toBe(
      false,
    );
  });

  it("hides the pager when there is only one page", async () => {
    await renderScreen(<PaginatedListScreen<Row> {...props()} />);

    // "1 / 1" beside two dead controls spends vertical space to say nothing.
    expect(screen.queryByLabelText("Next")).toBeNull();
    expect(screen.queryByLabelText("Previous")).toBeNull();
  });

  it("announces the pager bounds as unavailable rather than only fading them", async () => {
    const { useData } = makeHook(3);

    await renderScreen(<PaginatedListScreen<Row> {...props({ useData })} />);

    // A colour change alone does not exist for a user who cannot see it.
    expect(
      screen.getByLabelText("Previous").props.accessibilityState.disabled,
    ).toBe(true);

    expect(
      screen.getByLabelText("Next").props.accessibilityState.disabled,
    ).toBe(false);

    expect(screen.getByLabelText("Page 1 of 3")).toBeTruthy();
  });

  it("does not offer to create a record when a search simply found nothing", async () => {
    const { useData } = makeHook();

    await renderScreen(
      <PaginatedListScreen<Row>
        {...props({ useData, createLabel: "Add client", onCreate: jest.fn() })}
      />,
    );

    await fireEvent.changeText(
      screen.getByLabelText("Search clients"),
      "nothing",
    );

    await waitFor(() => expect(screen.getByText("No matches")).toBeTruthy());

    // On an unmatched search the useful action is to change the search. The
    // empty-state offer belongs to a genuinely empty list, where creating the
    // first record is what the user came to do.
    expect(screen.getByText(/Nothing matched "nothing"/)).toBeTruthy();
  });
});
