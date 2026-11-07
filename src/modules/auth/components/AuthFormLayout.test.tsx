import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { AuthFormLayout } from "./AuthFormLayout";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));

async function scrollProps() {
  await render(
    <AuthFormLayout>
      <Text>form</Text>
    </AuthFormLayout>,
  );

  return screen.getByTestId("auth-form-scroll").props as {
    keyboardShouldPersistTaps?: string;
    contentContainerStyle?: Record<string, number | string>;
  };
}

describe("AuthFormLayout", () => {
  it("lets a tap reach a button while the keyboard is open", async () => {
    // Without this the first press is spent dismissing the keyboard, so
    // signing in appears to need two taps.
    expect((await scrollProps()).keyboardShouldPersistTaps).toBe("handled");
  });

  it("centres the form but lets it scroll when it does not fit", async () => {
    const style = (await scrollProps()).contentContainerStyle ?? {};

    // flexGrow centres on a tall screen and still allows overflow on a short
    // one. A fixed flex is what leaves the lower fields unreachable once the
    // keyboard is up.
    expect(style.flexGrow).toBe(1);
    expect(style.justifyContent).toBe("center");
  });

  it("holds content clear of the notch and the home indicator", async () => {
    const style = (await scrollProps()).contentContainerStyle ?? {};

    expect(style.paddingTop).toBe(47 + 24);
    expect(style.paddingBottom).toBe(34 + 24);
  });

  it("renders the form it was given", async () => {
    await render(
      <AuthFormLayout>
        <Text>form</Text>
      </AuthFormLayout>,
    );

    expect(screen.getByText("form")).toBeTruthy();
  });
});
