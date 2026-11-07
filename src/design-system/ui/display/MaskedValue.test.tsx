import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { MaskedValue } from "./MaskedValue";

describe("MaskedValue", () => {
  it("hides all but the last four digits", async () => {
    const view = await render(<MaskedValue value="123456789" />);

    expect(view.getByText("•••-••-6789")).toBeTruthy();
    expect(view.queryByText("123456789")).toBeNull();
  });

  it("shows the full value when the eye is tapped", async () => {
    // The whole point of the control. Before it existed the number was masked
    // with no way to read it, so anyone who needed the full value had to ask
    // the client for it again -- slower, and less private, than showing it to
    // someone already authorised to see it.
    const view = await render(<MaskedValue value="123456789" />);

    void fireEvent.press(view.getByLabelText("Show the number"));

    // findBy rather than getBy: rendering is concurrent here, so the state
    // change is not visible on the very next line.
    expect(await view.findByText("123456789")).toBeTruthy();
  });

  it("hides it again when tapped a second time", async () => {
    const view = await render(<MaskedValue value="123456789" />);

    void fireEvent.press(view.getByLabelText("Show the number"));
    void fireEvent.press(await view.findByLabelText("Hide the number"));

    expect(await view.findByText("•••-••-6789")).toBeTruthy();
  });

  it("renders a placeholder rather than an empty mask when there is no value", async () => {
    // "•••-••-" with nothing after it reads as a stored number that failed to
    // load, and sends someone looking for data that was never entered.
    const view = await render(<MaskedValue />);

    expect(view.getByText("—")).toBeTruthy();
    expect(view.queryByLabelText("Show the number")).toBeNull();
  });
});
