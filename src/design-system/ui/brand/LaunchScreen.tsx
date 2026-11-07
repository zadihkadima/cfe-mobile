import { useEffect, useState } from "react";

import {
  Animated,
  Easing,
  StatusBar,
  View,
} from "react-native";

import { useTheme } from "@/design-system/theme/useTheme";
import { Logo } from "./Logo";

interface Props {
  /**
   * Shown under the wordmark. Left off during the ordinary opening, where the
   * screen is on-screen for a few hundred milliseconds and a caption would
   * appear and vanish before it could be read.
   */
  caption?: string;
}

/**
 * The screen the application opens on.
 *
 * ---------------------------------------------------------------------------
 * Why this exists at all, when the platform already shows a splash
 * ---------------------------------------------------------------------------
 *
 * The native splash configured in `app.config.js` is compiled into the binary.
 * It cannot follow a theme, because it is drawn by the operating system before
 * a line of JavaScript has run -- there is nothing to ask what theme is
 * selected, and no way to answer.
 *
 * So the opening is in two parts. The native splash covers the launch itself,
 * and this covers the gap that follows: restoring the session, deciding which
 * home screen the person's role gets. That gap used to render as `null`, which
 * is not nothing -- it is a blank frame, and on a slow device it is a blank
 * frame long enough to look like a crash.
 *
 * ---------------------------------------------------------------------------
 * Why the colours do not follow light and dark
 * ---------------------------------------------------------------------------
 *
 * `launchBackground` is the same value in both schemes of every theme. That is
 * deliberate, and it is the one place in the design system where a token
 * ignores the scheme.
 *
 * The native splash before it has exactly one background, fixed at build time.
 * If this screen were light under a light device and dark under a dark one, it
 * would match that fixed splash for one group of users and flash hard against
 * it for the other. Choosing one dark, contrasty colour per theme means the
 * transition is the same for everybody, and a dark field is also the more
 * forgiving of the two to open onto in a dim room.
 */
export function LaunchScreen({ caption }: Props) {
  const { theme } = useTheme();

  const background = theme.colors.launchBackground;
  const foreground = theme.colors.launchForeground;

  // Lazily-initialised state rather than a ref, because this value is read
  // during render -- the animated styles below interpolate from it. A ref read
  // in the render body is exactly what React's rules forbid, and the lazy
  // initialiser gives the same guarantee that matters here: the Animated.Value
  // is constructed once, not rebuilt on every render into something the
  // running animation is no longer driving.
  const [entrance] = useState(
    () => new Animated.Value(0),
  );

  useEffect(() => {
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    // Stopped on unmount. Session restoration usually finishes first, and an
    // animation still running against an unmounted component sets state on it.
    return () => animation.stop();
  }, [entrance]);

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: background }}
    >
      {/*
        The status bar is set from the launch background rather than the
        scheme. This screen is dark whichever scheme is active, so leaving the
        bar to follow the scheme would put dark icons on a dark field and hide
        the clock and battery entirely for anyone in light mode.
      */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={background}
      />

      <Animated.View
        style={{
          opacity: entrance,
          transform: [
            {
              // A small rise, not a zoom. The wordmark settling into place
              // reads as the app opening; a scale from nothing reads as a
              // notification.
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        }}
        className="items-center"
      >
        {/* The one place the mark animates. Everywhere else it is a fixed
            point in the furniture; here it is the only thing on screen, and
            the seal being struck gives the wait a shape. */}
        <Logo size={104} showWordmark={false} animated />

        <Animated.Text
          accessibilityRole="header"
          allowFontScaling={false}
          style={{
            color: foreground,
            fontSize: 18,
            fontWeight: "700",
            letterSpacing: 1.4,
            marginTop: 20,
          }}
        >
          CFE Tax Portal
        </Animated.Text>

        {caption ? (
          <Animated.Text
            style={{
              color: foreground,
              opacity: 0.7,
              marginTop: 12,
              fontSize: 13,
              letterSpacing: 1,
            }}
          >
            {caption}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </View>
  );
}
