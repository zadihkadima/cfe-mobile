import React from "react";
import { Image, View } from "react-native";

import clsx from "clsx";

import { ACCENTS, accentFor } from "../../theme/colors";
import { useTheme } from "../../theme/useTheme";

import { Text } from "../typography";

interface Props {

  /**
   * Usually "First Last". An email is accepted because a user who has been
   * invited but has not yet registered has no name on file, and rendering "?"
   * for every pending invitation makes a list of them indistinguishable.
   */
  name?: string;

  image?: string;

  size?: "sm" | "md" | "lg";

  className?: string;

}

const sizes = {

  sm: {
    container: "w-8 h-8",
    text: "text-xs",
    ring: 1,
  },

  md: {
    container: "w-10 h-10",
    text: "text-sm",
    ring: 1.5,
  },

  lg: {
    container: "w-14 h-14",
    text: "text-lg",
    ring: 2,
  },

};

/**
 * Derives up to two initials.
 *
 * The previous implementation took the first letter of the first two words,
 * which is wrong for the common case of a middle name: "Ada B Lovelace" gave
 * "AB" rather than "AL". It also indexed into words without checking they were
 * non-empty, so a name with a double space threw on `x[0]` of an empty string
 * — a crash originating in an avatar, which is the last place anyone would
 * look for it.
 */
export function getInitials(name?: string): string {

  const cleaned = name?.trim() ?? "";

  if (cleaned.length === 0) {
    return "?";
  }

  // `ada.lovelace@x.com` yields "AL", which is far more use than "A" and much
  // more than "?".
  if (cleaned.includes("@")) {
    const local = cleaned.split("@")[0];

    const parts = local.split(/[._-]+/).filter(Boolean);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return local.slice(0, 2).toUpperCase();
  }

  // Splitting on a run of whitespace rather than a single space, so repeated
  // or non-standard spacing cannot produce empty entries.
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  // First and last, skipping middle names — how a person abbreviates their own
  // name.
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();

}

/**
 * Initials or a photograph, in a circle.
 *
 * In a list its job is to give the eye something to track down the left edge,
 * which is most of what makes a list scannable rather than a block of text.
 *
 * Every avatar used to be the same tint of the brand colour, which meant the
 * circle carried no information — the initials inside it did all the work, and
 * a column of identical circles is a column of identical shapes. The colour is
 * now derived from the name, so a person looks the same every time you see
 * them and two people are told apart before either is read. This matters most
 * where initials are weakest: colleagues who share them.
 *
 * The colour is computed, never stored. Persisting it would mean a migration
 * for a decoration, and a renamed user keeping a colour that no longer follows
 * from their name.
 *
 * It is hidden from assistive technology on purpose: the row states the
 * person's name in full immediately beside it, so announcing "A L" first would
 * make every row open with noise. That also means the colour must never be the
 * only thing distinguishing two entries — it is a second cue behind the
 * initials, not a replacement for them.
 */
export function Avatar({

  name,

  image,

  size = "md",

  className,

}: Props) {

  const { theme } = useTheme();

  const s = sizes[size];

  /*
   * Whether the photograph could actually be fetched.
   *
   * Keyed on the uri, so a new picture is always given its own chance: a
   * component that had failed once would otherwise stay failed for the rest of
   * its life, and the most likely moment for the uri to change is immediately
   * after somebody uploads a replacement.
   */
  const [failedFor, setFailedFor] = React.useState<string | null>(null);

  const shared = clsx(
    s.container,
    "rounded-full",
    className,
  );

  /*
   * A photograph that will not load falls back to initials.
   *
   * Without this the component rendered a bare <Image> whenever it was given a
   * uri, and an <Image> that fails to fetch draws nothing at all -- so a link
   * that had expired, or a request that failed offline, left an empty circle
   * where a person should be. Initials are what this component draws for
   * everybody without a picture, and they are a far better answer than a hole
   * in the layout.
   */
  if (image && failedFor !== image) {

    return (

      <Image

        source={{ uri: image }}

        className={shared}

        /*
          A themed ring, and a backing in the same colour.

          A photograph is the one thing in the interface the palette has no say
          over: someone's picture might be any colour at all, and against a
          surface the theme chose it can sit on the page like a sticker. The
          ring gives it a border the theme does control, which is enough to
          make it read as part of the design rather than pasted onto it.

          A tint cannot do this job. React Native's `tintColor` replaces every
          pixel with one colour, which turns a face into a silhouette -- and
          the point of showing a picture is that it can be recognised. There is
          no equivalent of a CSS filter on a native <Image> without pulling in
          a shader library, and recolouring people's faces is not something
          worth that dependency.

          The backing shows while the image is loading and behind anything with
          transparency, so a PNG with a cut-out background lands on a themed
          circle rather than on whatever happens to be underneath.
        */
        style={{
          borderWidth: s.ring,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceVariant,
        }}

        onError={() => setFailedFor(image)}

        // The avatar is hidden from assistive technology, so there is no
        // accessible handle to reach it by. This is the only way a test can
        // ask what happens when the picture fails to arrive.
        testID="avatar-image"

        accessibilityElementsHidden

        importantForAccessibility="no-hide-descendants"

      />

    );

  }

  // Keyed on the raw name so the same person resolves identically wherever
  // they appear. Initials would collide far more often — every "AL" would
  // share a colour, defeating the point.
  const accent = ACCENTS[accentFor(name)][theme.isDark ? "dark" : "light"];

  return (

    <View

      className={clsx(

        shared,

        "items-center",

        "justify-center",

      )}

      // Set here rather than through a class because these are not theme
      // tokens: they are fixed hues that must not move when the theme does.
      // Subtle rather than solid. At list density a column of full-strength
      // circles pulls the eye away from the names, which are the content; the
      // marker should be findable, not loud.
      style={{ backgroundColor: accent.subtle }}

      accessibilityElementsHidden

      importantForAccessibility="no-hide-descendants"

    >

      <Text

        variant="label"

        weight="600"

        className={s.text}

        // Paired with the background above; the two are tuned together for
        // contrast and neither is safe with a different partner.
        style={{ color: accent.strong }}

      >

        {getInitials(name)}

      </Text>

    </View>

  );

}
