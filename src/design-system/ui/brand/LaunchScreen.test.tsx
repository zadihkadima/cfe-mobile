import { render, screen } from "@testing-library/react-native";

import { DEFAULT_THEME, themes } from "@/design-system/theme/colors";

import { LaunchScreen } from "./LaunchScreen";

/**
 * Rendered without a ThemeProvider on purpose.
 *
 * The provider drives NativeWind's colour scheme, which needs the compiled
 * Tailwind output to know that dark mode is class-based. Under Jest there is
 * none, so mounting the provider here would fail for a reason that has nothing
 * to do with this component.
 *
 * Leaving it out is not a workaround. The theme context falls back to the
 * default palette when no provider sits above it, which is exactly the case
 * being asserted here: what a device that has never opened the appearance
 * screen shows when the application starts.
 */

const WORDMARK = "CFE Tax Portal";

it("shows the wordmark", async () => {
  await render(<LaunchScreen />);

  expect(screen.getByText(WORDMARK)).toBeTruthy();
});

it("announces the wordmark as a heading", async () => {
  // The first thing a screen reader reaches when the application opens should
  // identify it, rather than be read as an unlabelled fragment of text.
  await render(<LaunchScreen />);

  expect(screen.getByRole("header")).toBeTruthy();
});

it("draws the wordmark in the default theme's launch colour", async () => {
  // Named through DEFAULT_THEME rather than through whichever palette happens
  // to hold that position. Spelling the theme out here meant that changing the
  // default failed this test for a reason that had nothing to do with the
  // behaviour it is describing.
  await render(<LaunchScreen />);

  expect(screen.getByText(WORDMARK)).toHaveStyle({
    color: themes[DEFAULT_THEME].light.launchForeground,
  });
});

it("does not scale the wordmark with the system font size", async () => {
  // The wordmark sits under the mark with wide tracking and already reaches
  // the edge of a small screen. A device set to the largest accessibility text
  // size would push it past that, and the first thing anyone saw of the
  // product would be clipped.
  await render(<LaunchScreen />);

  expect(screen.getByText(WORDMARK).props.allowFontScaling).toBe(false);
});

it("omits the caption unless one is given", async () => {
  await render(<LaunchScreen />);

  expect(screen.queryByText("Restoring your session")).toBeNull();
});

it("shows a caption when one is given", async () => {
  await render(<LaunchScreen caption="Restoring your session" />);

  expect(screen.getByText("Restoring your session")).toBeTruthy();
});
