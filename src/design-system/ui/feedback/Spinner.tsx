import { useEffect, useState } from "react";
import { Animated, Easing, Platform, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { useTheme } from "@/design-system/theme/useTheme";

const AnimatedView = Animated.View;

interface Props {
  /** Diameter in points. */
  size?: number;

  /**
   * Stroke weight. Left to follow the size by default, because a fixed weight
   * that reads as a hairline at 48 points reads as a doughnut at 16.
   */
  strokeWidth?: number;

  /**
   * The colour of the leading end of the arc. Defaults to the theme's brand
   * colour; a caller sitting on a brand-coloured fill passes its own.
   */
  color?: string;

  /** Announced while the spinner is on screen. */
  label?: string;
}

/**
 * An indeterminate progress indicator drawn as an SVG arc.
 *
 * ---------------------------------------------------------------------------
 * Why not ActivityIndicator
 * ---------------------------------------------------------------------------
 *
 * The platform spinner takes a single `color` and draws a fixed shape that
 * differs between iOS and Android -- so the one thing on screen during every
 * wait is the one thing that does not follow the design system, and does not
 * look the same on two devices sitting side by side.
 *
 * This is a three-quarter arc with a gradient running along it, fading from
 * the brand colour to transparent. The fade is what makes rotation legible:
 * a closed ring of even weight is rotationally symmetric, so it can spin
 * without appearing to move at all.
 *
 * ---------------------------------------------------------------------------
 * Why the rotation is a transform on a wrapping view
 * ---------------------------------------------------------------------------
 *
 * The arc itself never changes; only the view holding it turns. That keeps the
 * whole animation on the native driver, which matters more here than anywhere
 * else in the app: a spinner is shown precisely when the JavaScript thread is
 * busy doing the work being waited on. Animating an SVG attribute instead
 * would drive it from JS and stutter under exactly the load it exists to
 * cover -- and a spinner that stutters makes a working app look hung.
 */
export function Spinner({
  size = 24,
  strokeWidth,
  color,
  label = "Loading",
}: Props) {
  const { theme } = useTheme();

  // Lazily initialised rather than held in a ref, because the value is read
  // during render by the interpolation below. A ref read in the render body is
  // what React's rules forbid; the lazy initialiser still guarantees the value
  // is built once rather than replaced on every render, which would leave the
  // running animation driving an object nothing is showing.
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        // Linear on purpose. Any easing makes the arc visibly speed up and
        // slow down once per turn, which reads as stalling -- the single
        // impression a progress indicator must never give.
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
      }),
    );

    rotation.start();

    // Stopped on unmount. A spinner is unmounted the moment the thing it was
    // waiting for arrives, and a loop left running holds a timer and keeps
    // setting values on a component that is gone.
    return () => rotation.stop();
  }, [spin]);

  const stroke = strokeWidth ?? Math.max(2, size / 10);
  const tint = color ?? theme.colors.primary;

  // The radius is inset by half the stroke so the arc sits inside the box.
  // Without the inset the outer half of the stroke is clipped by the viewBox,
  // and the spinner looks like a ring with flat spots at the compass points.
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Ids are global to the SVG document, so two spinners on one screen sharing
  // one id would both take whichever gradient rendered last -- and the second
  // would silently adopt the first's colour.
  const gradientId = `spinner-${size}-${tint.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <View
      // Marked as an element in its own right. Without this the role and
      // label below sit on a node the platform never stops at, so the wait is
      // announced to nobody -- which is the whole failure these accessibility
      // props exist to avoid.
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      // Indeterminate: there is no `now` value, and claiming one would have a
      // screen reader announce a percentage that means nothing.
      accessibilityValue={{ text: label }}
      style={{ width: size, height: size }}
    >
      <AnimatedView
        style={{
          width: size,
          height: size,
          transform: [
            {
              rotate: spin.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        }}
      >
        <Svg width={size} height={size} fill="none">
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2={size} y2={size}>
              <Stop offset="0" stopColor={tint} stopOpacity={0} />
              <Stop offset="1" stopColor={tint} stopOpacity={1} />
            </LinearGradient>
          </Defs>

          {/* The track. Kept at a low opacity rather than omitted, so the
              spinner reads as an arc travelling around a ring instead of a
              detached mark drifting in space. */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={tint}
            strokeOpacity={0.15}
            strokeWidth={stroke}
          />

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            // Three quarters drawn, one quarter open. A shorter arc reads as a
            // dot chasing its tail; a longer one closes the gap and the
            // rotation stops being visible.
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
          />
        </Svg>
      </AnimatedView>
    </View>
  );
}
