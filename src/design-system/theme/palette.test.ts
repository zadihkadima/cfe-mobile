import {
  DEFAULT_THEME,
  THEME_NAMES,
  TOKENS,
  alphaOf,
  cssVariables,
  cssVariablesForTheme,
  dark,
  light,
  themes,
  varName,
  type ThemeName,
} from "./palette";

/**
 * The palette is the one module in the design system where a mistake is both
 * invisible in review and invisible at runtime.
 *
 * A missing token does not throw. It resolves to `undefined`, the class name
 * that depends on it silently fails to apply, and the element renders
 * transparent -- on one screen, under one theme, in one colour scheme. These
 * tests assert the shape that makes that impossible.
 */
describe("palette", () => {
  it("uses woodland as the default", () => {
    expect(DEFAULT_THEME).toBe("woodland");
    expect(light).toBe(themes.woodland.light);
    expect(dark).toBe(themes.woodland.dark);
  });

  it.each(THEME_NAMES)(
    "%s defines every token in both schemes",
    (name) => {
      // A token present in one theme and absent from another is the failure
      // this suite exists for: the app looks right until someone switches
      // theme, and then one element on one screen loses its colour.
      for (const token of TOKENS) {
        expect(themes[name].light).toHaveProperty(token);
        expect(themes[name].dark).toHaveProperty(token);

        expect(themes[name].light[token]).toBeTruthy();
        expect(themes[name].dark[token]).toBeTruthy();
      }
    },
  );

  it.each(THEME_NAMES)("%s is described for the picker", (name) => {
    expect(themes[name].label).toBeTruthy();
    expect(themes[name].description).toBeTruthy();
  });

  describe("css variables", () => {
    it.each(THEME_NAMES)(
      "%s publishes both schemes at once",
      (name) => {
        const published = cssVariablesForTheme(name);

        // Both sides have to be present simultaneously. NativeWind decides
        // between `bg-surface` and `dark:bg-dark-surface` from the colour
        // scheme, so publishing only the active one would leave every `dark:`
        // class in the application resolving to nothing.
        expect(published).toHaveProperty("--color-surface");
        expect(published).toHaveProperty("--color-dark-surface");

        expect(Object.keys(published)).toHaveLength(TOKENS.length * 2);
      },
    );

    it("emits space-separated rgb channels, not hex", () => {
      // The channels are unwrapped so Tailwind can compose them with an
      // opacity modifier. A hex value here would break every `bg-x/50` in the
      // app, and break it quietly.
      const seafoam = cssVariables("seafoam", "dark");

      expect(seafoam["--color-dark-background"]).toBe("2 16 14");
      expect(seafoam["--color-dark-primary"]).toBe("103 192 172");
    });

    it("keeps only the colour channels of a translucent token", () => {
      const slate = cssVariables("slate", "light");

      // scrim is rgba(11,27,43,0.45); the alpha is applied by the class, not
      // stored in the variable.
      expect(slate["--color-scrim"]).toBe("11 27 43");
    });

    it("falls back to the default for a theme that no longer exists", () => {
      // The stored name comes off the device and may have been written by a
      // build offering a theme this one withdrew. Reading colours off
      // `undefined` would render the whole application colourless.
      //
      // Typed as `string` first because that is what actually arrives from
      // storage; the cast then stands in for the boundary the real caller
      // crosses, rather than being a formality.
      const stored: string = "not-a-theme";

      const unknown = cssVariables(stored as ThemeName, "light");

      expect(unknown).toEqual(cssVariables(DEFAULT_THEME, "light"));
    });

    it("names dark variables apart from light ones", () => {
      expect(varName("surfaceVariant", "light")).toBe(
        "--color-surface-variant",
      );
      expect(varName("surfaceVariant", "dark")).toBe(
        "--color-dark-surface-variant",
      );
    });
  });

  describe("alpha", () => {
    it("reports 1 for an opaque colour", () => {
      expect(alphaOf("#FFFFFF")).toBe(1);
    });

    it("reads the alpha out of an rgba token", () => {
      expect(alphaOf("rgba(15,23,42,0.45)")).toBeCloseTo(0.45);
    });
  });
});
