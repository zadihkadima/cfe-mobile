import type { TextStyle } from "react-native";

/**
 * The type scale.
 *
 * This module used to be six bare numbers -- a font size and nothing else.
 * A size alone does not describe a typeface's role, so every screen had to
 * decide the weight, the line height and the tracking for itself, and they
 * all decided differently: the same "section heading" appeared as
 * `text-xl font-semibold` in one place and `text-2xl font-bold` in another.
 * Hierarchy that is re-derived per screen is not hierarchy.
 *
 * Each role below therefore carries everything needed to render it. A
 * component asks for `body` and receives the size, the weight, the leading
 * and the tracking together, so the same role reads identically everywhere
 * and the scale can be retuned in one place.
 *
 * Line heights are set proportionally rather than by eye: tight for large
 * display type, which already has presence and only looks loose when opened
 * up, and generous for body copy, which is read in runs and needs the room.
 * Tracking follows the same logic in reverse -- large type is negatively
 * tracked to close the gaps that scaling exaggerates, small type is tracked
 * open to stay legible.
 */

export type TypographyRole =
  | "display"
  | "title"
  | "heading"
  | "headline"
  | "body"
  | "bodyStrong"
  | "label"
  | "caption"
  | "overline";

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle["fontWeight"];
  letterSpacing: number;
  textTransform?: TextStyle["textTransform"];
}

export const typography: Record<TypographyRole, TypeStyle> = {
  /** Screen-defining type. One per screen at most, often none. */
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.6,
  },

  /** The screen's own name, in the header or as a large inline title. */
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.4,
  },

  /** A major section within a screen. */
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
    letterSpacing: -0.3,
  },

  /**
   * A card or list-item title. This role was missing, which is why card
   * titles were written as body text made bold by hand and drifted between
   * 16 and 18 points depending on which screen you looked at.
   */
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  /** Running text. The default, and the size everything else is judged against. */
  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: -0.1,
  },

  /** Body copy that needs emphasis without being promoted to a heading. */
  bodyStrong: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  /** Buttons, form labels, metadata sitting beside a value. */
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: -0.1,
  },

  /** Secondary information: timestamps, helper text, counts. */
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
    letterSpacing: 0,
  },

  /**
   * Group labels above a section. Uppercase and widely tracked, because at
   * this size the letterforms need the separation to stay distinguishable.
   */
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
};

/**
 * Semantic text colours, resolved to class names rather than hex values, so
 * that one choice at the call site covers both themes.
 */
export type TextTone =
  | "default"
  | "secondary"
  | "muted"
  | "inverted"
  | "primary"
  | "success"
  | "warning"
  | "danger";

export const textTones: Record<TextTone, string> = {
  default: "text-text dark:text-dark-text",
  secondary: "text-text-secondary dark:text-dark-text-secondary",
  muted: "text-text-muted dark:text-dark-text-muted",
  inverted: "text-text-inverted dark:text-dark-text-inverted",
  primary: "text-primary dark:text-dark-primary",
  success: "text-success dark:text-dark-success",
  warning: "text-warning dark:text-dark-warning",
  danger: "text-danger dark:text-dark-danger",
};
