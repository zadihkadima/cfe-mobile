import {
  ACCENTS,
  ACCENT_NAMES,
  DEFAULT_THEME,
  THEME_NAMES,
  accentFor,
  themes,
} from "./palette";

/**
 * Contrast is the one property of a palette that cannot be judged by looking
 * at it.
 *
 * Two of the supplied source colours -- #67C0AC and #FA8D22 -- are perfectly
 * pleasant and completely unusable as a button fill under white text: they
 * reach about 2.0:1 and 2.3:1, where WCAG AA asks for 4.5:1. The palettes
 * darken them for that role and keep the originals as the `Light` variants.
 *
 * That decision lives in a comment, and a comment does not survive the next
 * person who thinks the brand colour looks washed out and puts it back. This
 * does.
 */

/** Relative luminance, per WCAG 2.1. */
function luminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());

  if (!match) {
    throw new Error(`not an opaque hex colour: ${hex}`);
  }

  const channel = (value: number) => {
    const sRGB = value / 255;

    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };

  const [r, g, b] = [1, 2, 3].map((i) => channel(parseInt(match[i], 16)));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two opaque colours, from 1:1 to 21:1. */
function contrast(a: string, b: string): number {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));

  return (light + 0.05) / (dark + 0.05);
}

/**
 * 4.5:1 is the WCAG AA threshold for body text.
 *
 * Applied to the pairings that carry actual reading: body text on the page,
 * body text on a card, and the label inside a filled primary button. Decorative
 * pairings are not checked, because holding a swatch to a reading standard
 * would force the palette flat.
 */
const AA_BODY = 4.5;

/** 3:1, the AA threshold for large text and for interface components. */
const AA_LARGE = 3;

describe("theme contrast", () => {
  describe.each(THEME_NAMES)("%s", (name) => {
    describe.each(["light", "dark"] as const)("%s scheme", (scheme) => {
      const palette = themes[name][scheme];

      it("sets body text legibly on the page", () => {
        expect(
          contrast(palette.text, palette.background),
        ).toBeGreaterThanOrEqual(AA_BODY);
      });

      it("sets body text legibly on a card", () => {
        expect(
          contrast(palette.text, palette.surface),
        ).toBeGreaterThanOrEqual(AA_BODY);
      });

      it("sets secondary text legibly on a card", () => {
        expect(
          contrast(palette.textSecondary, palette.surface),
        ).toBeGreaterThanOrEqual(AA_BODY);
      });

      it("labels a filled primary button legibly", () => {
        // This is the pairing that rules out using #67C0AC or #FA8D22 as
        // `primary` directly, and the reason each theme darkens its brand
        // colour for the fill.
        expect(
          contrast(palette.textInverted, palette.primary),
        ).toBeGreaterThanOrEqual(AA_BODY);
      });

      it("shows the wordmark clearly on the launch screen", () => {
        // The launch screen is three characters at 56 points, so the large
        // text threshold is the one that applies.
        expect(
          contrast(palette.launchForeground, palette.launchBackground),
        ).toBeGreaterThanOrEqual(AA_LARGE);
      });

      it("keeps muted text readable rather than merely visible", () => {
        // Muted text is still text. It is held to the large-text threshold
        // because it is used for captions and hints, not for paragraphs.
        expect(
          contrast(palette.textMuted, palette.surface),
        ).toBeGreaterThanOrEqual(AA_LARGE);
      });

      it("separates a border from the surface it delimits", () => {
        // A border that cannot be seen is not a border. This one is
        // deliberately low: 1.2:1 catches a border set to the same value as
        // its surface without demanding that every hairline look like a rule.
        expect(
          contrast(palette.border, palette.surface),
        ).toBeGreaterThan(1.2);
      });

      it("keeps danger distinguishable on a card", () => {
        expect(
          contrast(palette.danger, palette.surface),
        ).toBeGreaterThanOrEqual(AA_BODY);
      });
    });
  });
});

/**
 * The categorical accents are held to the same standard as the themes.
 *
 * Their subtle/strong pairing is what makes an avatar readable, and it is easy
 * to add a ninth hue that looks right next to the other eight and fails behind
 * two dark initials. These run over every accent so a new one cannot be added
 * without being checked.
 */
describe("categorical accents", () => {
  describe.each(ACCENT_NAMES)("%s", (accent) => {
    describe.each(["light", "dark"] as const)("%s scheme", (scheme) => {
      const pair = ACCENTS[accent][scheme];

      it("sets its initials legibly on its own background", () => {
        expect(contrast(pair.strong, pair.subtle)).toBeGreaterThanOrEqual(
          AA_BODY,
        );
      });

      it("stays distinct from the surface it sits on", () => {
        // An avatar whose background matches the card behind it is an avatar
        // with no shape. This is a boundary, not text, so the bar is low --
        // but it is not 1.
        const surface = themes[DEFAULT_THEME][scheme].surface;

        expect(contrast(pair.subtle, surface)).toBeGreaterThan(1.1);
      });
    });
  });
});

/**
 * The point of deriving the colour rather than storing it is that it is
 * reproducible. If it were not, a person would change colour between screens
 * and the feature would be worse than the single tint it replaced.
 */
describe("accentFor", () => {
  it("gives the same name the same accent every time", () => {
    expect(accentFor("Ada Lovelace")).toBe(accentFor("Ada Lovelace"));
  });

  it("ignores capitalisation and surrounding space", () => {
    // The same person arrives spelled differently from different endpoints.
    expect(accentFor("  ada lovelace ")).toBe(accentFor("Ada Lovelace"));
  });

  it("always names a real accent", () => {
    const names = ["Ada", "Grace Hopper", "x@y.com", "", "  ", "Ω"];

    for (const name of names) {
      expect(ACCENT_NAMES).toContain(accentFor(name));
    }
  });

  it("falls back rather than throwing when there is no name", () => {
    // Avatars render during loading, before a name has arrived. A decoration
    // must not be able to take down the screen it decorates.
    expect(ACCENT_NAMES).toContain(accentFor(undefined));
    expect(ACCENT_NAMES).toContain(accentFor(null));
  });

  it("spreads a realistic set of names across the hues", () => {
    // Not a distribution test -- a hash that returned one value would pass
    // every assertion above while restoring exactly the problem this replaced.
    const people = [
      "Ada Lovelace", "Grace Hopper", "Alan Turing", "Katherine Johnson",
      "Edsger Dijkstra", "Barbara Liskov", "Donald Knuth", "Margaret Hamilton",
      "Ken Thompson", "Radia Perlman", "Tim Berners-Lee", "Anita Borg",
    ];

    const used = new Set(people.map(accentFor));

    expect(used.size).toBeGreaterThanOrEqual(4);
  });
});
