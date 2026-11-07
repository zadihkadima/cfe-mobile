import { render, screen } from "@testing-library/react-native";

import { UnreadBadge } from "./UnreadBadge";

describe("UnreadBadge", () => {
  // A quiet list must stay quiet. An empty circle on every row is noise that
  // trains people to stop looking at the badge at all.
  it("shows nothing when there is nothing waiting", async () => {
    await render(<UnreadBadge count={0} label="unread messages" />);

    expect(screen.queryByText("0")).toBeNull();
  });

  it("shows nothing for a negative count", async () => {
    await render(<UnreadBadge count={-3} label="unread messages" />);

    expect(screen.toJSON()).toBeNull();
  });

  it("shows the count", async () => {
    await render(<UnreadBadge count={7} label="unread messages" />);

    expect(screen.getByText("7")).toBeTruthy();
  });

  // An unbounded number widens the pill until it pushes the rest of the row
  // out of place, and the exact figure stops being useful long before that.
  it("caps a large count rather than widening the row", async () => {
    await render(<UnreadBadge count={1284} label="unread messages" />);

    expect(screen.getByText("99+")).toBeTruthy();
  });

  it("shows the exact count at the boundary", async () => {
    await render(<UnreadBadge count={99} label="unread messages" />);

    expect(screen.getByText("99")).toBeTruthy();
  });

  // A bare number read aloud says nothing about what it counts.
  it("says what it is counting", async () => {
    await render(<UnreadBadge count={4} label="unread messages in Acme" />);

    expect(screen.getByLabelText("4 unread messages in Acme")).toBeTruthy();
  });
});
