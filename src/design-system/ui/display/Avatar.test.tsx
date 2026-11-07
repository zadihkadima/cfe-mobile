import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { Avatar, getInitials } from "./Avatar";

/**
 * The initials are asserted directly rather than through a render, because the
 * avatar is deliberately hidden from assistive technology — the row states the
 * person's name in full beside it, so announcing "A L" first would make every
 * row open with noise. A query by text therefore cannot see it, and testing
 * the pure function is the honest way to pin the behaviour anyway.
 */
describe("getInitials", () => {
  it("takes the first and last name, not the first two words", () => {
    // The previous implementation sliced the first two words, so a middle name
    // produced "AB" for Ada B Lovelace.
    expect(getInitials("Ada B Lovelace")).toBe("AL");
  });

  it("does not throw on irregular spacing", () => {
    // Splitting on a single space produced empty entries, and indexing [0] of
    // one threw — a crash surfacing from an avatar, which is the last place
    // anyone would think to look for it.
    expect(getInitials("  Ada   Lovelace  ")).toBe("AL");
  });

  it("derives initials from an email when no name is on file", () => {
    // An invited user has no name yet, and "?" on every pending invitation
    // makes a list of them indistinguishable from one another.
    expect(getInitials("ada.lovelace@example.com")).toBe("AL");
    expect(getInitials("ada_lovelace@example.com")).toBe("AL");
    expect(getInitials("ada@example.com")).toBe("AD");
  });

  it("falls back to two letters for a single word", () => {
    expect(getInitials("Ada")).toBe("AD");
  });

  it("returns a placeholder rather than failing on a missing name", () => {
    expect(getInitials(undefined)).toBe("?");
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});

/**
 * The fallback is asserted through a render because it is a question about
 * behaviour over time -- what the component does *after* a fetch fails --
 * which the pure function above cannot answer.
 *
 * Every query opts into hidden elements. The avatar is deliberately hidden
 * from assistive technology, so the default queries cannot see any part of it,
 * and an assertion that something is absent would pass whether the component
 * worked or not.
 */
describe("when the photograph cannot be loaded", () => {
  const initials = () =>
    screen.queryByText("AL", { includeHiddenElements: true });

  const failTheImage = () =>
    fireEvent(
      screen.getByTestId("avatar-image", { includeHiddenElements: true }),
      "error",
    );

  it("shows the picture while it is still loading", async () => {
    await render(
      <Avatar name="Ada Lovelace" image="https://example.com/ada.jpg" />,
    );

    // Initials must not flash up underneath a picture that is about to arrive.
    expect(initials()).toBeNull();
  });

  it("falls back to initials once the image reports a failure", async () => {
    await render(
      <Avatar name="Ada Lovelace" image="https://example.com/ada.jpg" />,
    );

    // An <Image> that fails to fetch draws nothing at all, so without this the
    // component left an empty circle where a person should be.
    failTheImage();

    await waitFor(() => expect(initials()).toBeTruthy());
  });

  it("gives a replacement picture its own chance to load", async () => {
    await render(
      <Avatar name="Ada Lovelace" image="https://example.com/old.jpg" />,
    );

    failTheImage();
    await waitFor(() => expect(initials()).toBeTruthy());

    // The most likely moment for the uri to change is immediately after
    // somebody uploads a replacement. Tracking failure as a boolean would
    // leave them looking at initials until the screen was rebuilt.
    await screen.rerender(
      <Avatar name="Ada Lovelace" image="https://example.com/new.jpg" />,
    );

    expect(initials()).toBeNull();
  });
});
