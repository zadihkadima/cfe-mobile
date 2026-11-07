import { render, screen } from "@testing-library/react-native";

import { Spinner } from "./Spinner";

/**
 * A spinner is the one thing on screen during a wait, and it is easy to ship
 * one that is invisible to a screen reader: it draws no text, so unless it
 * carries a role and a label the wait is silent and the app appears to have
 * stopped responding for anyone not looking at it.
 */
describe("Spinner", () => {
  it("announces itself as progress", async () => {
    await render(<Spinner />);

    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  it("carries a default label", async () => {
    await render(<Spinner />);

    expect(screen.getByLabelText("Loading")).toBeTruthy();
  });

  it("takes a label describing the particular wait", async () => {
    // "Loading" is right for a list and wrong for a sign-out. The caller knows
    // which wait this is; the component cannot.
    await render(<Spinner label="Signing out" />);

    expect(screen.getByLabelText("Signing out")).toBeTruthy();
  });

  it("keeps the arc inside the box it is given", async () => {
    // The stroke is centred on the radius, so a radius of size/2 puts its
    // outer half outside the viewBox and the platform clips it -- which shows
    // as flat spots at the compass points rather than as an obviously wrong
    // size, and so survives a casual look.
    await render(<Spinner size={40} />);

    const { width, height } = screen.getByLabelText("Loading").props.style;

    expect(width).toBe(40);
    expect(height).toBe(40);
  });
});
