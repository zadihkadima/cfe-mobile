/**
 * The single source of truth for colour in the application.
 *
 * This file is plain CommonJS rather than TypeScript because it has two
 * consumers that cannot share a module format: the React components import it
 * through `colors.ts`, and `tailwind.config.js` requires it at build time,
 * before any TypeScript transform has run.
 *
 * Semantic names only. A component asks for `surface` or `danger`, never for a
 * hex value, so a token can be retuned here and every screen follows.
 *
 * ---------------------------------------------------------------------------
 * Why there are four themes, and how a theme reaches the screen
 * ---------------------------------------------------------------------------
 *
 * Colour reaches components by two paths: class names (`bg-surface`), which
 * Tailwind resolves when the bundle is built, and `theme.colors.surface`, read
 * at runtime. Around 99 files use the first and 21 the second.
 *
 * That split is why a theme cannot simply be a different object handed to the
 * provider. Doing that would recolour the 21 and leave the 99 showing whatever
 * was compiled in -- an app themed one fifth of the way, which reads as a bug
 * rather than as a setting.
 *
 * So class names no longer resolve to a hex value. They resolve to a CSS
 * variable, and the provider assigns those variables at runtime. Both paths
 * then read the same value from the same place, every screen follows the
 * selected theme, and none of the 120 files had to be edited.
 *
 * Adding a theme means adding an entry to `themes` below. Nothing else.
 */

/**
 * Status colours are shared by every theme, deliberately.
 *
 * The brand may change with the theme; "this is dangerous" may not. A delete
 * button that is red under one theme and teal under another has stopped being
 * a warning and become decoration -- and the person who has seen it ten times
 * in teal is the one who will not stop to read it the eleventh.
 */
const statusLight = {
  info: "#2563EB",
  infoSubtle: "#DBEAFE",
  success: "#166534",
  successSubtle: "#DCFCE7",
  warning: "#B45309",
  warningSubtle: "#FEF3C7",
  danger: "#991B1B",
  dangerSubtle: "#FEE2E2",
};

const statusDark = {
  info: "#60A5FA",
  infoSubtle: "#152A45",
  success: "#22C55E",
  successSubtle: "#0F2A1B",
  warning: "#F59E0B",
  warningSubtle: "#2E220A",
  danger: "#F87171",
  dangerSubtle: "#3A1A1A",
};

// ---------------------------------------------------------------------------
// CFE -- brand blue, navy and aqua.
//
// The palette is built around the product brand: dark navy for the main
// navigation and panel structure, blue for primary actions and links, and aqua
// for focus rings and highlight states. It keeps a light background and white
// cards so the content remains readable and the brand remains distinct.
// ---------------------------------------------------------------------------

const cfeLight = {
  background: "#F5F8FC",
  surface: "#FFFFFF",
  surfaceVariant: "#EAF1F8",
  elevated: "#FFFFFF",

  primary: "#087CF0",
  primaryLight: "#4FA0FF",
  primaryDark: "#06152B",
  primarySubtle: "#E6F3FF",

  secondary: "#0B2B59",
  secondaryLight: "#2F4E7A",
  secondaryDark: "#06152B",
  secondarySubtle: "#E9F0FB",

  accent: "#00C8F0",

  text: "#183653",
  textSecondary: "#45617E",
  textMuted: "#6E8197",
  textInverted: "#FFFFFF",

  border: "#DCE5F0",
  divider: "#EAF0F6",

  ...statusLight,

  overlay: "rgba(6,21,43,0.14)",
  scrim: "rgba(6,21,43,0.45)",

  skeleton: "#EAF0F6",
  skeletonHighlight: "#F2F7FB",

  // The opening screen. Dark under both schemes on purpose -- see the note on
  // `launchBackground` in the appearance screen.
  launchBackground: "#06152B",
  launchForeground: "#00C8F0",
};

const cfeDark = {
  background: "#06152B",
  surface: "#0B2B59",
  surfaceVariant: "#113A73",
  elevated: "#0E335F",

  primary: "#4AA6FF",
  primaryLight: "#82C4FF",
  primaryDark: "#087CF0",
  primarySubtle: "#0E2F56",

  secondary: "#00C8F0",
  secondaryLight: "#5CDFF8",
  secondaryDark: "#0E92B2",
  secondarySubtle: "#0E324A",

  accent: "#00C8F0",

  text: "#EAF3FF",
  textSecondary: "#C2D7F0",
  textMuted: "#9FB7D3",
  textInverted: "#06152B",

  border: "#274B7A",
  divider: "#183A68",

  ...statusDark,

  overlay: "rgba(3,9,18,0.58)",
  scrim: "rgba(3,9,18,0.72)",

  skeleton: "#113A73",
  skeletonHighlight: "#1A4E89",

  launchBackground: "#06152B",
  launchForeground: "#00C8F0",
};

// ---------------------------------------------------------------------------
// Slate -- ink, teal and brass.
//
// Eight colours: #0B1B2B, #17314D, #2E6E8E, #12726B, #4FB3A6, #E8B04B,
// #DCE6EE, #FFFFFF. The original theme was navy and brass and very little
// else, which read as sober from a distance and as grey up close. The navy is
// kept -- it is the colour the product is known by -- and a teal is added
// beside it so `secondary` is a different hue rather than a different
// darkness, with the brass held back for the accent alone. A navy button, a
// teal button and a brass badge are now three distinguishable things.
// ---------------------------------------------------------------------------

const slateLight = {
  // Canvas and containers. `background` is the page, `surface` is a raised
  // container on it, `surfaceVariant` a recessed or secondary fill, and
  // `elevated` the highest layer (sheets, popovers, sticky headers).
  background: "#F2F5F8",
  surface: "#FFFFFF",
  surfaceVariant: "#DCE6EE",
  elevated: "#F9FBFD",

  // Brand. The light/dark variants exist so a component can build a hover,
  // pressed or subdued state without compositing opacity over an unknown
  // backdrop, which is what makes translucent overlays look muddy.
  primary: "#17314D",
  primaryLight: "#2E6E8E",
  primaryDark: "#0B1B2B",
  primarySubtle: "#DEE8F1",

  secondary: "#12726B",
  secondaryLight: "#4FB3A6",
  secondaryDark: "#0A4E4A",
  secondarySubtle: "#D8F0EC",

  accent: "#E8B04B",

  // Text. Three weights are enough to establish hierarchy; a fourth invites
  // arbitrary choices and the hierarchy stops meaning anything.
  text: "#0B1B2B",
  textSecondary: "#3F5468",
  textMuted: "#6B7F92",
  textInverted: "#FFFFFF",

  // Lines. `border` delimits an interactive edge, `divider` separates content
  // within a container and is deliberately fainter.
  border: "#C4D3E0",
  divider: "#DEE7EF",

  ...statusLight,

  // Scrims behind modals and sheets.
  overlay: "rgba(11,27,43,0.14)",
  scrim: "rgba(11,27,43,0.45)",

  // Skeleton placeholders. Kept as tokens so a loading state is designed
  // rather than improvised from whatever grey was nearest.
  skeleton: "#DEE7EF",
  skeletonHighlight: "#EFF4F8",

  // The opening screen. Dark under both schemes on purpose -- see the note on
  // `launchBackground` in the appearance screen.
  launchBackground: "#0B1B2B",
  launchForeground: "#E8B04B",
};

/**
 * Dark is a designed theme, not an inversion.
 *
 * Surfaces get lighter as they rise, which is how depth reads without shadow
 * on a dark canvas; simply inverting the light ramp would reverse that and
 * flatten the hierarchy. Brand colours are lifted well above their light
 * counterparts because #17314D on a near-black background is unreadable, and
 * status colours are desaturated to stay legible without glowing.
 */
const slateDark = {
  background: "#040B13",
  surface: "#0B1622",
  surfaceVariant: "#1B3145",
  elevated: "#122036",

  primary: "#5CA8CE",
  primaryLight: "#8FC9E4",
  primaryDark: "#17314D",
  primarySubtle: "#12283A",

  secondary: "#4FB3A6",
  secondaryLight: "#82CFC5",
  secondaryDark: "#12726B",
  secondarySubtle: "#0D2A28",

  accent: "#E8B04B",

  text: "#E6EEF6",
  textSecondary: "#9DB2C4",
  textMuted: "#70889C",
  textInverted: "#06121C",

  border: "#2A415A",
  divider: "#17293C",

  ...statusDark,

  overlay: "rgba(6,15,24,0.55)",
  scrim: "rgba(2,6,12,0.68)",

  skeleton: "#1B3145",
  skeletonHighlight: "#24415A",

  launchBackground: "#0B1B2B",
  launchForeground: "#E8B04B",
};

// ---------------------------------------------------------------------------
// Seafoam -- teal and coral on cream.
//
// Eight colours: #0B3B36, #12726B, #67C0AC, #A8DEC9, #F2E5D1, #F7B267,
// #F18271, #C2503C. On white, #67C0AC reaches about 2.0:1 against white text
// and #F18271 about 2.7:1 -- both well under the 4.5:1 that WCAG AA asks for
// body text, so a button filled with either and labelled in white is
// unreadable in daylight. The palette therefore supplies its own deepened
// forms of each (#12726B, #C2503C) for fills, and keeps the originals as the
// `Light` variants, where they do the job they are good at: hover, pressed
// and subdued states. The apricot #F7B267 is the accent, giving the theme a
// third hue that neither of the other two has to pretend to be.
// ---------------------------------------------------------------------------

const seafoamLight = {
  background: "#FAF4EA",
  surface: "#FFFFFF",
  surfaceVariant: "#E8F3EC",
  elevated: "#FDFAF5",

  primary: "#12726B",
  primaryLight: "#67C0AC",
  primaryDark: "#0B3B36",
  primarySubtle: "#D9F0E8",

  secondary: "#C2503C",
  secondaryLight: "#F18271",
  secondaryDark: "#8E3728",
  secondarySubtle: "#FBE4DF",

  accent: "#F7B267",

  text: "#0B3B36",
  textSecondary: "#3D5751",
  textMuted: "#6B837C",
  textInverted: "#FFFFFF",

  border: "#D6CBB6",
  divider: "#EBE1D0",

  ...statusLight,

  overlay: "rgba(11,59,54,0.14)",
  scrim: "rgba(11,59,54,0.45)",

  skeleton: "#EBE1D0",
  skeletonHighlight: "#F6EFE4",

  launchBackground: "#0B3B36",
  launchForeground: "#67C0AC",
};

const seafoamDark = {
  background: "#02100E",
  surface: "#071A17",
  surfaceVariant: "#143630",
  elevated: "#0B2723",

  primary: "#67C0AC",
  primaryLight: "#A8DEC9",
  primaryDark: "#12726B",
  primarySubtle: "#0C2A25",

  secondary: "#F18271",
  secondaryLight: "#F7A899",
  secondaryDark: "#B85644",
  secondarySubtle: "#2A1512",

  accent: "#F7B267",

  text: "#F2E5D1",
  textSecondary: "#A9C0B8",
  textMuted: "#7B938C",
  textInverted: "#041613",

  border: "#1E4A42",
  divider: "#123029",

  ...statusDark,

  overlay: "rgba(2,11,9,0.58)",
  scrim: "rgba(2,11,9,0.72)",

  skeleton: "#143630",
  skeletonHighlight: "#1D4740",

  launchBackground: "#0B3B36",
  launchForeground: "#67C0AC",
};

// ---------------------------------------------------------------------------
// Cobalt -- ultramarine, magenta and orange.
//
// Eight colours: #000938, #001689, #2A3FB0, #8098F0, #B5215E, #E8467C,
// #FA8D22, #FFE4C4. The blues carry white text as given. #FA8D22 does not --
// about 2.3:1 against white -- so it stays the accent in both schemes, where
// it is a badge, an icon or an underline rather than a fill. The magenta is
// what makes this theme worth having: with only blue and orange, everything
// that was not a call to action defaulted to blue, and the screen ended up
// monochrome with one loud button on it.
// ---------------------------------------------------------------------------

const cobaltLight = {
  background: "#F4F7FF",
  surface: "#FFFFFF",
  surfaceVariant: "#DFE6FA",
  elevated: "#FAFBFF",

  primary: "#001689",
  primaryLight: "#2A3FB0",
  primaryDark: "#000938",
  primarySubtle: "#DDE3F7",

  secondary: "#B5215E",
  secondaryLight: "#E8467C",
  secondaryDark: "#7E1441",
  secondarySubtle: "#FBDDE8",

  accent: "#FA8D22",

  text: "#000938",
  textSecondary: "#33405F",
  textMuted: "#5C6782",
  textInverted: "#FFFFFF",

  border: "#C6D0EE",
  divider: "#E1E7F7",

  ...statusLight,

  overlay: "rgba(0,9,56,0.14)",
  scrim: "rgba(0,9,56,0.50)",

  skeleton: "#E1E7F7",
  skeletonHighlight: "#F0F3FC",

  launchBackground: "#000938",
  launchForeground: "#FA8D22",
};

const cobaltDark = {
  background: "#00061F",
  surface: "#061243",
  surfaceVariant: "#0E1C55",
  elevated: "#0A1749",

  primary: "#8098F0",
  primaryLight: "#AEBCF7",
  primaryDark: "#001689",
  primarySubtle: "#0C1A52",

  secondary: "#FF7BA6",
  secondaryLight: "#FFA9C4",
  secondaryDark: "#B5215E",
  secondarySubtle: "#331424",

  accent: "#FA8D22",

  text: "#DCE6FF",
  textSecondary: "#99A9D0",
  textMuted: "#6B7CA8",
  textInverted: "#000938",

  border: "#22336B",
  divider: "#14235C",

  ...statusDark,

  overlay: "rgba(0,4,26,0.60)",
  scrim: "rgba(0,4,26,0.72)",

  skeleton: "#0E1C55",
  skeletonHighlight: "#182A6B",

  launchBackground: "#000938",
  launchForeground: "#FA8D22",
};

// ---------------------------------------------------------------------------
// Azure -- daylight blue, coral and sunflower.
//
// Eight colours: #0A2540, #14507E, #2F80C8, #54A4FF, #9FD0FF, #C4503A,
// #FF7A59, #FFC93C. This was a ramp of five blues, which is a constraint that
// does not survive contact with a real interface: with no second hue,
// `secondary` could only be told from `primary` by darkness, so two buttons
// side by side looked like one button and its disabled state. A warm pair now
// does that work -- coral for the second action, sunflower for the accent --
// and the blues are free to be what they are good at, which is structure.
// ---------------------------------------------------------------------------

const azureLight = {
  background: "#F3F7FC",
  surface: "#FFFFFF",
  surfaceVariant: "#DCE9F7",
  elevated: "#F9FBFE",

  primary: "#14507E",
  primaryLight: "#2F80C8",
  primaryDark: "#0A2540",
  primarySubtle: "#DEEAF6",

  secondary: "#C4503A",
  secondaryLight: "#FF7A59",
  secondaryDark: "#8C351F",
  secondarySubtle: "#FDE3DC",

  accent: "#FFC93C",

  text: "#0A2540",
  textSecondary: "#3B4E66",
  textMuted: "#64758C",
  textInverted: "#FFFFFF",

  border: "#C3D5E8",
  divider: "#DDE8F3",

  ...statusLight,

  overlay: "rgba(10,37,64,0.14)",
  scrim: "rgba(10,37,64,0.48)",

  skeleton: "#DDE8F3",
  skeletonHighlight: "#EEF4FA",

  launchBackground: "#0A2540",
  launchForeground: "#FFC93C",
};

const azureDark = {
  background: "#03080F",
  surface: "#0B1826",
  surfaceVariant: "#1A3550",
  elevated: "#112339",

  primary: "#54A4FF",
  primaryLight: "#9FD0FF",
  primaryDark: "#14507E",
  primarySubtle: "#10273D",

  secondary: "#FF7A59",
  secondaryLight: "#FFA98F",
  secondaryDark: "#C4503A",
  secondarySubtle: "#331A13",

  accent: "#FFC93C",

  text: "#E3EFFB",
  textSecondary: "#9DB4CB",
  textMuted: "#6E869E",
  textInverted: "#050F1A",

  border: "#2A4767",
  divider: "#17304A",

  ...statusDark,

  overlay: "rgba(3,8,14,0.58)",
  scrim: "rgba(3,8,14,0.72)",

  skeleton: "#1A3550",
  skeletonHighlight: "#24445F",

  launchBackground: "#0A2540",
  launchForeground: "#FFC93C",
};

// ---------------------------------------------------------------------------
// Harbour -- petrol blue, copper and brass.
//
// Eight colours: #06222C, #0B3C4C, #13647F, #35A5CC, #5CCBE0, #B84E27,
// #E2643C, #E4A11B. This is the default theme, which is the reason it needed
// the most work: it was five steps of one hue, and a screen built from one
// hue reads as a screen that has not been designed. The petrol ramp still
// carries structure -- headers, primary actions, links -- and copper now
// carries the second action while brass carries the accent. Warm on cold is
// the oldest pairing there is and it is legible at a glance, which is the
// only test that matters for a colour a person sees every day.
// ---------------------------------------------------------------------------

const harbourLight = {
  background: "#F1F7F9",
  surface: "#FFFFFF",
  surfaceVariant: "#DCEAF0",
  elevated: "#F8FBFC",

  primary: "#0B3C4C",
  primaryLight: "#13647F",
  primaryDark: "#06222C",
  primarySubtle: "#DAE9EF",

  secondary: "#B84E27",
  secondaryLight: "#E2643C",
  secondaryDark: "#85361A",
  secondarySubtle: "#FBE3D9",

  accent: "#E4A11B",

  text: "#06222C",
  textSecondary: "#33505C",
  textMuted: "#5B7280",
  textInverted: "#FFFFFF",

  border: "#BED4DE",
  divider: "#DAE7ED",

  ...statusLight,

  overlay: "rgba(6,34,44,0.14)",
  scrim: "rgba(6,34,44,0.48)",

  skeleton: "#DAE7ED",
  skeletonHighlight: "#EDF4F7",

  launchBackground: "#06222C",
  launchForeground: "#E4A11B",
};

const harbourDark = {
  background: "#020D11",
  surface: "#051A22",
  surfaceVariant: "#0D3644",
  elevated: "#082530",

  primary: "#35A5CC",
  primaryLight: "#5CCBE0",
  primaryDark: "#13647F",
  primarySubtle: "#062630",

  secondary: "#E2643C",
  secondaryLight: "#F0906F",
  secondaryDark: "#B84E27",
  secondarySubtle: "#2C1610",

  accent: "#E4A11B",

  text: "#DCEEF4",
  textSecondary: "#98B8C6",
  textMuted: "#7098A8",
  textInverted: "#03141A",

  border: "#17495B",
  divider: "#0A2A36",

  ...statusDark,

  overlay: "rgba(1,8,11,0.58)",
  scrim: "rgba(1,8,11,0.72)",

  skeleton: "#0D3644",
  skeletonHighlight: "#124556",

  launchBackground: "#06222C",
  launchForeground: "#E4A11B",
};

// ---------------------------------------------------------------------------
// Ember -- navy and sky, lit by orange and gold.
//
// Eight colours: #0D2233, #144F82, #2E86C1, #71C5E8, #D9EDF7, #B33F08,
// #FF6518, #FFB300. The orange is the point of this palette and also the one
// colour that cannot be used as given: at about 3.0:1 against white it is
// fine for a large glyph and unusable behind a white label. So the palette
// carries its own darkened form, #B33F08, for fills, and #FF6518 lights the
// dark scheme where it finally has room. The gold is the accent, and it is
// what keeps the light scheme from being a blue page with one orange button.
// ---------------------------------------------------------------------------

const emberLight = {
  background: "#F5F9FC",
  surface: "#FFFFFF",
  surfaceVariant: "#D9EDF7",
  elevated: "#FAFCFE",

  primary: "#144F82",
  primaryLight: "#2E86C1",
  primaryDark: "#0D2233",
  primarySubtle: "#DEEAF4",

  secondary: "#B33F08",
  secondaryLight: "#FF6518",
  secondaryDark: "#7D2C05",
  secondarySubtle: "#FDE4D7",

  accent: "#FFB300",

  text: "#0D2233",
  textSecondary: "#3E4B57",
  textMuted: "#63727F",
  textInverted: "#FFFFFF",

  border: "#BDD6E5",
  divider: "#DCE9F1",

  ...statusLight,

  overlay: "rgba(13,34,51,0.14)",
  scrim: "rgba(13,34,51,0.48)",

  skeleton: "#DCE9F1",
  skeletonHighlight: "#EEF5F9",

  launchBackground: "#0D2233",
  launchForeground: "#FF6518",
};

const emberDark = {
  background: "#060B12",
  surface: "#0D1720",
  surfaceVariant: "#1C3243",
  elevated: "#142333",

  primary: "#71C5E8",
  primaryLight: "#A2DBF2",
  primaryDark: "#144F82",
  primarySubtle: "#102636",

  secondary: "#FF7A33",
  secondaryLight: "#FFA470",
  secondaryDark: "#B33F08",
  secondarySubtle: "#331708",

  accent: "#FFB300",

  text: "#DCEDF7",
  textSecondary: "#9FB2BD",
  textMuted: "#77878F",
  textInverted: "#0A121A",

  border: "#2A4257",
  divider: "#182937",

  ...statusDark,

  overlay: "rgba(2,6,10,0.58)",
  scrim: "rgba(2,6,10,0.72)",

  skeleton: "#1C3243",
  skeletonHighlight: "#26394C",

  launchBackground: "#0D2233",
  launchForeground: "#FF6518",
};

// ---------------------------------------------------------------------------
// Claret -- burgundy, olive and gold.
//
// Eight colours: #2A0E18, #611427, #97324B, #E8899E, #4C5E37, #5E7345,
// #C9A227, #EFEADA. The burgundy is nearly the same darkness as the shared
// danger red, which is a genuine hazard in a product with destructive
// actions: a brand button and a delete button that read alike get pressed
// alike. Two things keep them apart. `primary` stays cooler and deeper than
// `danger` rather than being tuned toward it, and the olive takes every
// secondary action, so the red-family colour on any given screen is almost
// always the one that actually means stop.
// ---------------------------------------------------------------------------

const claretLight = {
  background: "#FBF7F2",
  surface: "#FFFFFF",
  surfaceVariant: "#EFEADA",
  elevated: "#FDFBF7",

  primary: "#611427",
  primaryLight: "#97324B",
  primaryDark: "#2A0E18",
  primarySubtle: "#F5DFE4",

  secondary: "#4C5E37",
  secondaryLight: "#5E7345",
  secondaryDark: "#333F22",
  secondarySubtle: "#E4EBD8",

  accent: "#C9A227",

  text: "#2A0E18",
  textSecondary: "#59454C",
  textMuted: "#7C6B71",
  textInverted: "#FFFFFF",

  border: "#E0D3C6",
  divider: "#EFE6DB",

  ...statusLight,

  overlay: "rgba(42,14,24,0.14)",
  scrim: "rgba(42,14,24,0.48)",

  skeleton: "#EFE6DB",
  skeletonHighlight: "#F8F2EA",

  launchBackground: "#2A0E18",
  launchForeground: "#C9A227",
};

const claretDark = {
  background: "#150A0F",
  surface: "#241119",
  surfaceVariant: "#351A25",
  elevated: "#2C1520",

  primary: "#E8899E",
  primaryLight: "#F2B3C0",
  primaryDark: "#97324B",
  primarySubtle: "#35161F",

  secondary: "#A9C48B",
  secondaryLight: "#C8DCB2",
  secondaryDark: "#5E7345",
  secondarySubtle: "#1E2617",

  accent: "#E8C45A",

  text: "#F1E4DC",
  textSecondary: "#C0A6AC",
  textMuted: "#907A80",
  textInverted: "#241119",

  border: "#452431",
  divider: "#301723",

  ...statusDark,

  overlay: "rgba(8,4,6,0.58)",
  scrim: "rgba(8,4,6,0.72)",

  skeleton: "#351A25",
  skeletonHighlight: "#43222F",

  launchBackground: "#2A0E18",
  launchForeground: "#C9A227",
};

// ---------------------------------------------------------------------------
// Lagoon -- deep teal, turquoise, coral and citrus.
//
// Eight colours: #002F3F, #066569, #0E9A8D, #21D9BE, #A8F0E2, #C24A4A,
// #FF6B6B, #FFD166. #21D9BE is the colour this palette is for and it reaches
// about 1.7:1 on white -- one of the least usable fills anywhere in this
// file. It is the accent throughout, and carries text only in the dark scheme
// where it sits on near-black. The coral is what stops the theme reading as a
// single wash of blue-green: it is the second action in both schemes, and it
// is far enough from the shared danger red in hue and lightness not to be
// mistaken for it.
// ---------------------------------------------------------------------------

const lagoonLight = {
  background: "#F2FAF9",
  surface: "#FFFFFF",
  surfaceVariant: "#D6F0EA",
  elevated: "#F9FDFC",

  primary: "#066569",
  primaryLight: "#0E9A8D",
  primaryDark: "#002F3F",
  primarySubtle: "#D8EFEC",

  secondary: "#C24A4A",
  secondaryLight: "#FF6B6B",
  secondaryDark: "#8C3232",
  secondarySubtle: "#FBE0E0",

  accent: "#21D9BE",

  text: "#002F3F",
  textSecondary: "#3A5158",
  textMuted: "#64797E",
  textInverted: "#FFFFFF",

  border: "#BCDCD6",
  divider: "#D9ECE8",

  ...statusLight,

  overlay: "rgba(0,47,63,0.14)",
  scrim: "rgba(0,47,63,0.48)",

  skeleton: "#D9ECE8",
  skeletonHighlight: "#ECF7F4",

  launchBackground: "#002F3F",
  launchForeground: "#21D9BE",
};

const lagoonDark = {
  background: "#000C10",
  surface: "#021A22",
  surfaceVariant: "#0A4451",
  elevated: "#032A36",

  primary: "#21D9BE",
  primaryLight: "#A8F0E2",
  primaryDark: "#0E9A8D",
  primarySubtle: "#04262C",

  secondary: "#FF6B6B",
  secondaryLight: "#FF9C9C",
  secondaryDark: "#C24A4A",
  secondarySubtle: "#2E1517",

  accent: "#FFD166",

  text: "#D6F2ED",
  textSecondary: "#93B7B8",
  textMuted: "#6F8B8D",
  textInverted: "#001318",

  border: "#125562",
  divider: "#053B48",

  ...statusDark,

  overlay: "rgba(0,10,14,0.58)",
  scrim: "rgba(0,10,14,0.72)",

  skeleton: "#0A4451",
  skeletonHighlight: "#0F5462",

  launchBackground: "#002F3F",
  launchForeground: "#21D9BE",
};

// ---------------------------------------------------------------------------
// Woodland -- forest, olive and terracotta.
//
// From the eight-colour set #0F1E14, #1D4A54, #435700, #5DA684, #F2ECD8,
// #F2D272, #DD923D and #C94F44. Having eight source colours rather than five
// means every role can be filled from the palette itself instead of being
// derived, which is why this is the only theme here whose light scheme uses a
// supplied colour for its page background.
//
// The terracotta #C94F44 is deliberately *not* used for anything, despite
// being in the set. It is close enough to the shared danger red to be mistaken
// for it, and a brand colour that looks like a warning is worse than a brand
// colour left on the shelf.
// ---------------------------------------------------------------------------

const woodlandLight = {
  background: "#F7F3E6",
  surface: "#FFFFFF",
  surfaceVariant: "#F2ECD8",
  elevated: "#FCFAF3",

  primary: "#1D4A54",
  primaryLight: "#3A6F79",
  primaryDark: "#0F1E14",
  primarySubtle: "#DDE9EB",

  secondary: "#435700",
  secondaryLight: "#5DA684",
  secondaryDark: "#2C3A00",
  secondarySubtle: "#E7ECCF",

  accent: "#DD923D",

  text: "#0F1E14",
  textSecondary: "#3D4A42",
  textMuted: "#6A7269",
  textInverted: "#FFFFFF",

  border: "#D8CFB4",
  divider: "#E9E2CC",

  ...statusLight,

  overlay: "rgba(15,30,20,0.14)",
  scrim: "rgba(15,30,20,0.48)",

  skeleton: "#E9E2CC",
  skeletonHighlight: "#F4EFE1",

  launchBackground: "#0F1E14",
  launchForeground: "#F2D272",
};

const woodlandDark = {
  background: "#0A150E",
  surface: "#0F1E14",
  surfaceVariant: "#1D4A54",
  elevated: "#14291B",

  primary: "#5DA684",
  primaryLight: "#8AC5A8",
  primaryDark: "#1D4A54",
  primarySubtle: "#12241A",

  secondary: "#F2D272",
  secondaryLight: "#F7E3A6",
  secondaryDark: "#DD923D",
  secondarySubtle: "#2A2312",

  accent: "#DD923D",

  text: "#F2ECD8",
  textSecondary: "#A9B0A2",
  textMuted: "#7E877C",
  textInverted: "#0F1E14",

  border: "#2C4438",
  divider: "#1A2C20",

  ...statusDark,

  overlay: "rgba(0,0,0,0.58)",
  scrim: "rgba(0,0,0,0.72)",

  skeleton: "#1D4A54",
  skeletonHighlight: "#265B66",

  launchBackground: "#0F1E14",
  launchForeground: "#F2D272",
};

// ---------------------------------------------------------------------------
// Blossom -- pastels.
//
// From #937B72, #FCF895, #FDD1F0, #FDF0A6 and #FA94DD. Four of these five are
// pastels, and a pastel is a background: #FCF895 reaches 1.1:1 on white and
// #FA94DD about 2.1:1. There is no adjustment that makes them carry a white
// label, so this theme is built the other way around from the rest -- the
// supplied colours fill the surface and subtle roles they are suited to, and
// the text and fill roles use deepened forms of the same hues.
//
// It is the lightest theme here by some way. That is the point of it; it is
// also why the light scheme leans on `surfaceVariant` for separation rather
// than on borders, which at these values would be either invisible or harsh.
// ---------------------------------------------------------------------------

const blossomLight = {
  background: "#FFFBF2",
  surface: "#FFFFFF",
  surfaceVariant: "#FDF0A6",
  elevated: "#FFFDF8",

  primary: "#8E2E6E",
  primaryLight: "#C25AA0",
  primaryDark: "#661F4F",
  primarySubtle: "#FDD1F0",

  secondary: "#7A6259",
  secondaryLight: "#937B72",
  secondaryDark: "#584740",
  secondarySubtle: "#F0E7E3",

  accent: "#FA94DD",

  text: "#2E2126",
  textSecondary: "#584750",
  textMuted: "#7A6870",
  textInverted: "#FFFFFF",

  border: "#E8D6CF",
  divider: "#F4E9E3",

  ...statusLight,

  overlay: "rgba(46,33,38,0.14)",
  scrim: "rgba(46,33,38,0.45)",

  skeleton: "#F4E9E3",
  skeletonHighlight: "#FBF4F0",

  launchBackground: "#2E2126",
  launchForeground: "#FA94DD",
};

const blossomDark = {
  background: "#1A1317",
  surface: "#2E2126",
  surfaceVariant: "#3D2C34",
  elevated: "#37262D",

  primary: "#FA94DD",
  primaryLight: "#FDBDE9",
  primaryDark: "#8E2E6E",
  primarySubtle: "#3A1F31",

  secondary: "#FCF895",
  secondaryLight: "#FDFBC0",
  secondaryDark: "#8A8433",
  secondarySubtle: "#302D14",

  accent: "#FDD1F0",

  text: "#FDF0A6",
  textSecondary: "#C4AFB8",
  textMuted: "#937B72",
  textInverted: "#2E2126",

  border: "#4C3841",
  divider: "#382831",

  ...statusDark,

  overlay: "rgba(0,0,0,0.58)",
  scrim: "rgba(0,0,0,0.72)",

  skeleton: "#3D2C34",
  skeletonHighlight: "#4B3640",

  launchBackground: "#2E2126",
  launchForeground: "#FA94DD",
};

/**
 * Every theme, keyed by the name that is persisted to the device.
 *
 * The key is written to storage and read back on the next launch, so renaming
 * one silently resets everybody who had chosen it. Add freely; rename only
 * with a migration.
 */
const themes = {
  cfe: {
    label: "CFE",
    description: "Brand blue with a dark navigation sidebar",
    light: cfeLight,
    dark: cfeDark,
  },
  slate: {
    label: "Slate",
    description: "Ink and teal with brass",
    light: slateLight,
    dark: slateDark,
  },
  seafoam: {
    label: "Seafoam",
    description: "Teal and coral on cream",
    light: seafoamLight,
    dark: seafoamDark,
  },
  cobalt: {
    label: "Cobalt",
    description: "Ultramarine, magenta, orange",
    light: cobaltLight,
    dark: cobaltDark,
  },
  azure: {
    label: "Azure",
    description: "Daylight blue and coral",
    light: azureLight,
    dark: azureDark,
  },
  harbour: {
    label: "Harbour",
    description: "Petrol blue and copper",
    light: harbourLight,
    dark: harbourDark,
  },
  ember: {
    label: "Ember",
    description: "Navy and sky lit by orange",
    light: emberLight,
    dark: emberDark,
  },
  claret: {
    label: "Claret",
    description: "Burgundy, olive and gold",
    light: claretLight,
    dark: claretDark,
  },
  lagoon: {
    label: "Lagoon",
    description: "Turquoise with coral and citrus",
    light: lagoonLight,
    dark: lagoonDark,
  },
  woodland: {
    label: "Woodland",
    description: "Forest, olive and terracotta",
    light: woodlandLight,
    dark: woodlandDark,
  },
  blossom: {
    label: "Blossom",
    description: "Pastel pink and citrus",
    light: blossomLight,
    dark: blossomDark,
  },
};

/**
 * The palette a device gets before anyone opens the appearance screen.
 *
 * This is the product default theme, chosen for the branded layout and the
 * app install state.
 */
const DEFAULT_THEME = "cfe";

const THEME_NAMES = Object.keys(themes);

/**
 * The default theme's two schemes, still exported under their original names.
 *
 * `colors.light` and `colors.dark` are read in places that have nothing to do
 * with theme selection -- tests, and code that wants a concrete value rather
 * than whatever happens to be active. Keeping the names means adding themes
 * did not ripple into any of them.
 */
const light = themes[DEFAULT_THEME].light;
const dark = themes[DEFAULT_THEME].dark;

/**
 * Every token name, derived from the default theme rather than listed, so a
 * token added above cannot be forgotten here.
 */
const TOKENS = Object.keys(light);

/**
 * Converts `surfaceVariant` to `surface-variant`.
 *
 * Tailwind class names are kebab-case by convention, but the existing screens
 * were written against a mix of both spellings. Every token is therefore
 * exposed under each, so no existing class breaks while new work can use one
 * consistent convention.
 */
function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** The CSS custom property backing a token, e.g. `--color-surface-variant`. */
function varName(token, scheme) {
  return scheme === "dark"
    ? `--color-dark-${kebab(token)}`
    : `--color-${kebab(token)}`;
}

/**
 * `#67C0AC` becomes `103 192 172`.
 *
 * The channels are stored unwrapped so Tailwind can compose them with an
 * opacity modifier: `rgb(var(--color-primary) / <alpha-value>)` is what turns
 * `bg-primary/20` into a real colour. Putting `#67C0AC` in the variable
 * instead would break all 41 places that use a modifier, and break them
 * silently -- the class simply stops applying and the element renders
 * transparent.
 */
function channels(value) {
  const raw = String(value).trim();

  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(raw);

  if (short) {
    return [1, 2, 3].map((i) => parseInt(short[i] + short[i], 16)).join(" ");
  }

  const full = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(raw);

  if (full) {
    return [1, 2, 3].map((i) => parseInt(full[i], 16)).join(" ");
  }

  // `overlay` and `scrim` are rgba() strings: a scrim is defined by its
  // transparency, so it has no meaningful opaque form to decompose. Only the
  // colour channels go into the variable; the alpha is applied by
  // `tailwindColors` and by the provider.
  const rgba = /^rgba?\(([^)]+)\)$/i.exec(raw);

  if (rgba) {
    return rgba[1]
      .split(",")
      .slice(0, 3)
      .map((n) => n.trim())
      .join(" ");
  }

  throw new Error(`palette: cannot read colour channels from "${value}"`);
}

/** The alpha baked into an rgba() token, or 1 for an opaque one. */
function alphaOf(value) {
  const rgba = /^rgba\(([^)]+)\)$/i.exec(String(value).trim());

  if (!rgba) {
    return 1;
  }

  const parts = rgba[1].split(",");

  return parts.length > 3 ? Number(parts[3].trim()) : 1;
}

/**
 * The `{ "--color-x": "1 2 3" }` map for one theme in one scheme.
 *
 * Used at build time to seed `:root`, and at runtime by the provider. Both go
 * through this function, so the compiled defaults and the values assigned on a
 * theme change cannot describe different palettes.
 */
function cssVariables(themeName, scheme) {
  const theme = themes[themeName] ?? themes[DEFAULT_THEME];

  const map = {};

  for (const [token, value] of Object.entries(theme[scheme])) {
    map[varName(token, scheme)] = channels(value);
  }

  return map;
}

/** Both schemes at once, which is what a running application needs. */
function cssVariablesForTheme(themeName) {
  return {
    ...cssVariables(themeName, "light"),
    ...cssVariables(themeName, "dark"),
  };
}

/**
 * Builds the Tailwind colour map: every token as `token`, and its dark
 * counterpart as `dark-token`.
 *
 * The values are `rgb(var(--color-token) / <alpha-value>)` rather than hex, so
 * a class name resolves through the variable the provider controls. That
 * indirection is what lets a theme change reach the 99 files styled with class
 * names without editing any of them.
 */
function tailwindColors() {
  const map = {};

  const put = (name, cssVar, alpha) => {
    // A token whose value is already translucent cannot also honour an opacity
    // modifier: there is one alpha channel and the token has spent it. Those
    // are emitted at their fixed alpha, which is the behaviour they had
    // before -- `scrim` was never combinable either.
    const colour =
      alpha === 1
        ? `rgb(var(${cssVar}) / <alpha-value>)`
        : `rgba(var(${cssVar}) / ${alpha})`;

    map[name] = colour;
    map[kebab(name)] = colour;
  };

  for (const token of TOKENS) {
    put(token, varName(token, "light"), alphaOf(light[token]));
    put(`dark-${token}`, varName(token, "dark"), alphaOf(dark[token]));
  }

  return map;
}

// ---------------------------------------------------------------------------
// Categorical accents
//
// From #FFE500, #F05A2B, #2CB456, #00B5CE, #00B39D, #E4A3A7, #D1C5B0 and
// #8169B8. Eight distinct hues rather than one hue in eight steps, which makes
// this set useless as a theme and ideal as a way of telling things apart.
//
// These are deliberately NOT theme tokens and NOT CSS variables. A person's
// avatar colour should not change when the theme changes -- the whole value of
// it is that the same person is the same colour every time you see them, and a
// colour that moves with the theme is just decoration. So the hues are fixed
// across all themes, exactly as the status colours are, and only shift between
// the light and dark schemes so they stay legible.
//
// Each entry is a pair, not a colour: `subtle` is a background and `strong` is
// the text that sits on it. They are tuned together and neither is meaningful
// on its own -- `strong` on a surface, or `subtle` behind body text, will not
// hold up.
// ---------------------------------------------------------------------------

const ACCENTS = {
  amber: {
    light: { subtle: "#FAF0C4", strong: "#6B5000" },
    dark: { subtle: "#332B05", strong: "#FFE500" },
  },
  ember: {
    light: { subtle: "#FCE0D6", strong: "#993012" },
    // Was #331538 -- a purple, under a name that means a glowing coal, and
    // the same near-black as rose's. Two of the eight hues were therefore
    // indistinguishable from each other and from the darkest surfaces they
    // sit on, which is the one thing a categorical colour must not be.
    dark: { subtle: "#3D200C", strong: "#FF8A5F" },
  },
  fern: {
    light: { subtle: "#D3F1DC", strong: "#186631" },
    dark: { subtle: "#0C2A16", strong: "#4FD97C" },
  },
  cyan: {
    light: { subtle: "#CBEFF5", strong: "#015F6E" },
    dark: { subtle: "#052A31", strong: "#22D3EC" },
  },
  teal: {
    light: { subtle: "#CBEFE9", strong: "#016153" },
    dark: { subtle: "#052A25", strong: "#1FD9BE" },
  },
  rose: {
    light: { subtle: "#F8E3E4", strong: "#8E3940" },
    // Was #2E1640, a violet: it matched neither its own light scheme nor its
    // name, so a person whose avatar was rose changed hue with the scheme.
    dark: { subtle: "#3E2229", strong: "#F0AFB3" },
  },
  sand: {
    light: { subtle: "#F1ECE3", strong: "#5F5440" },
    dark: { subtle: "#2A251D", strong: "#D9CDB8" },
  },
  violet: {
    light: { subtle: "#E5DFF2", strong: "#4B3378" },
    dark: { subtle: "#342D54", strong: "#908efd" },
  },
};

const ACCENT_NAMES = Object.keys(ACCENTS);

/**
 * Picks one of the eight accents for a given string, always the same one.
 *
 * Used for avatars, where the alternative -- one shared brand colour for
 * everybody -- carries no information at all. This turns the avatar into a
 * second way of recognising a person alongside their initials, which matters
 * most in exactly the places initials are weakest: two people who share them.
 *
 * The hash is FNV-1a. Any stable hash would do; what matters is that it does
 * not depend on the platform, the locale or the run, because a colour that
 * changes between sessions is worse than no colour. `key` is lowercased so a
 * display name that arrives capitalised differently still lands on the same
 * hue.
 *
 * An empty or missing key returns the first accent rather than throwing --
 * this is decoration, and a missing name is a normal state during loading.
 */
function accentFor(key) {
  const text = String(key ?? "").trim().toLowerCase();
  if (!text) return ACCENT_NAMES[0];

  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    // FNV prime, applied with shifts to stay inside 32 bits without overflow.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return ACCENT_NAMES[hash % ACCENT_NAMES.length];
}

module.exports = {
  light,
  dark,
  themes,
  THEME_NAMES,
  DEFAULT_THEME,
  TOKENS,
  ACCENTS,
  ACCENT_NAMES,
  accentFor,
  kebab,
  varName,
  alphaOf,
  tailwindColors,
  cssVariables,
  cssVariablesForTheme,
};
