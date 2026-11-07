import { act, fireEvent, render, screen } from "@testing-library/react-native";

import * as Clipboard from "expo-clipboard";

import { CopyableId } from "./CopyableId";

const FULL_ID = "6a6ff86ba989c46f3717165e";

const AT_REST = `Identifier ${FULL_ID}. Copy`;

const setStringAsync = Clipboard.setStringAsync as jest.MockedFunction<
  typeof Clipboard.setStringAsync
>;

/**
 * `fireEvent.press` is awaited throughout rather than discarded with `void`,
 * which is the older habit elsewhere in this suite. It wraps the press in
 * `act` and hands back the promise, so dropping it and then opening a second
 * `act` to flush the component's own promise leaves the two overlapping.
 * React warns about that, and the render tree from the following test comes
 * back empty -- a failure that reads as a broken component rather than a
 * broken test.
 */
describe("CopyableId", () => {
  beforeEach(() => {
    setStringAsync.mockResolvedValue(true);
  });

  it("shows the end of the identifier, which is the part that varies", async () => {
    await render(<CopyableId id={FULL_ID} />);

    expect(screen.getByText("#3717165e")).toBeTruthy();
  });

  it("copies the whole identifier, not the part shown", async () => {
    await render(<CopyableId id={FULL_ID} />);

    await fireEvent.press(screen.getByLabelText(AT_REST));

    expect(setStringAsync).toHaveBeenCalledWith(FULL_ID);
  });

  it("names what the identifier belongs to", async () => {
    await render(<CopyableId id={FULL_ID} label="Task" />);

    expect(
      screen.getByLabelText(`Task identifier ${FULL_ID}. Copy`),
    ).toBeTruthy();
  });

  it("confirms the copy", async () => {
    await render(<CopyableId id={FULL_ID} />);

    await fireEvent.press(screen.getByLabelText(AT_REST));

    expect(screen.getByLabelText("Identifier copied")).toBeTruthy();
  });

  it("returns to rest after the confirmation has been seen", async () => {
    jest.useFakeTimers();

    try {
      await render(<CopyableId id={FULL_ID} />);

      await fireEvent.press(screen.getByLabelText(AT_REST));

      expect(screen.getByLabelText("Identifier copied")).toBeTruthy();

      await act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByLabelText(AT_REST)).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  /**
   * The clipboard is a platform service, and a failed write is not something
   * the user can act on. Confirming anyway would be a lie that costs them the
   * paste they were about to make.
   */
  it("withholds the confirmation when the write fails", async () => {
    setStringAsync.mockRejectedValue(new Error("clipboard unavailable"));

    await render(<CopyableId id={FULL_ID} />);

    await fireEvent.press(screen.getByLabelText(AT_REST));

    expect(screen.queryByLabelText("Identifier copied")).toBeNull();
    expect(screen.getByLabelText(AT_REST)).toBeTruthy();
  });

  /**
   * Guards the reason the component records which identifier was copied
   * rather than a bare yes or no. Moving to another record must not carry the
   * tick across to an identifier nobody copied.
   */
  it("does not carry the confirmation to another record", async () => {
    const view = await render(<CopyableId id={FULL_ID} />);

    await fireEvent.press(screen.getByLabelText(AT_REST));

    expect(screen.getByLabelText("Identifier copied")).toBeTruthy();

    await view.rerender(<CopyableId id="6a6ff86ba989c46f37171999" />);

    expect(screen.queryByLabelText("Identifier copied")).toBeNull();
  });

  it("renders nothing without an identifier", async () => {
    await render(<CopyableId id={undefined} />);

    expect(screen.toJSON()).toBeNull();
  });

  it("does not reach the clipboard when there is nothing to copy", async () => {
    await render(<CopyableId id="" />);

    expect(setStringAsync).not.toHaveBeenCalled();
  });
});
