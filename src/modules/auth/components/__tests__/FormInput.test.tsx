import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { FormInput } from "../FormInput";

/**
 * These assertions are deliberately specific about *which* association is
 * present.
 *
 * The screen-level tests query by label and pass if either mechanism is
 * wired, so they cannot tell the two apart. But they are not interchangeable
 * in the field: `accessibilityLabel` is what VoiceOver and TalkBack read,
 * while `nativeID`/`accessibilityLabelledBy` is the real Android association
 * that keeps the announced text tied to the text on screen. Losing one would
 * degrade a real user's experience on one platform while every other test in
 * the suite stayed green.
 */
it("announces the field by its visible label", async () => {
  await render(<FormInput label="Email Address" placeholder="your@email.com" />);

  const input = screen.getByLabelText("Email Address");

  expect(input.props.accessibilityLabel).toBe("Email Address");
});

it("ties the input to the label element for Android", async () => {
  await render(<FormInput label="Email Address" />);

  const input = screen.getByLabelText("Email Address");
  const label = screen.getByText("Email Address");

  expect(input.props.accessibilityLabelledBy).toBeTruthy();
  expect(input.props.accessibilityLabelledBy).toBe(label.props.nativeID);
});

it("gives two fields on one screen distinct label elements", async () => {
  await render(
    <>
      <FormInput label="Email Address" />
      <FormInput label="Password" />
    </>
  );

  const email = screen.getByLabelText("Email Address");
  const password = screen.getByLabelText("Password");

  // A shared id would make both inputs point at the same label, so a screen
  // reader would announce the password field as "Email Address".
  expect(email.props.accessibilityLabelledBy).not.toBe(password.props.accessibilityLabelledBy);
});

it("states the validation error to readers who cannot see the red border", async () => {
  await render(<FormInput label="Email Address" error="Enter a valid email address" />);

  const input = screen.getByLabelText("Email Address");

  // Colour is the only other signal that this field is wrong.
  expect(input.props.accessibilityHint).toBe("Enter a valid email address");
});

it("carries no hint when the field is valid", async () => {
  await render(<FormInput label="Email Address" />);

  expect(screen.getByLabelText("Email Address").props.accessibilityHint).toBeUndefined();
});

it("hides the decorative icon from the reading order", async () => {
  await render(<FormInput label="Email Address" icon={<Text>mail-icon</Text>} />);

  // The icon repeats the label. Announcing it makes the reader hear
  // "Email Address" twice before reaching the field.
  expect(screen.queryByLabelText("mail-icon")).toBeNull();
});

it("lets a person reveal and hide a password", async () => {
  await render(<FormInput label="Password" secureTextEntry value="secret" />);

  await fireEvent.press(screen.getByLabelText("Show password"));

  await waitFor(() => expect(screen.getByLabelText("Hide password")).toBeTruthy());
  expect(screen.queryByLabelText("Show password")).toBeNull();

  await fireEvent.press(screen.getByLabelText("Hide password"));

  await waitFor(() => expect(screen.getByLabelText("Show password")).toBeTruthy());
  expect(screen.queryByLabelText("Hide password")).toBeNull();
});
