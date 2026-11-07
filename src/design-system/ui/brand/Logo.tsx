
import { useEffect, useId, useState } from "react";
import { Animated, Easing, View, Text } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { useTheme } from "@/design-system/theme/useTheme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  /**
   * Height of the mark in points. Width follows the original logo ratio.
   */
  size?: number;

  /**
   * Whether to show the CFE wordmark beside the mark.
   */
  showWordmark?: boolean;

  /**
   * Whether the logo animates on mount.
   * Disabled by default for stable screen headers.
   */
  animated?: boolean;
}

export function Logo({
  size = 32,
  showWordmark = false,
  animated = false,
}: Props) {
  const { theme } = useTheme();

  // A unique gradient ID prevents collisions between logo instances.
  const instanceId = useId().replace(/:/g, "");
  const gradientId = `logo-gradient-${instanceId}`;

  // Original logo artwork is approximately 1.35 times wider than tall.
  const width = size * (1419 / 1050);
  const height = size;

  // C-shaped ring path. The stroke animation reveals it progressively.
  const RING_PATH =
    "M 88 27 " +
    "C 83 13 69 5 53 5 " +
    "C 31 5 13 19 10 37 " +
    "C 7 54 21 68 40 70 " +
    "C 56 72 71 65 82 53 " +
    "L 71 49 " +
    "C 63 57 52 61 41 58 " +
    "C 28 55 21 46 24 36 " +
    "C 27 25 38 17 51 17 " +
    "C 62 17 71 22 76 31 Z";

  // Letterforms are vector paths rather than font-dependent text.
  const F_PATH =
    "M 34 49 " +
    "L 39 34 " +
    "L 34 33 " +
    "L 36 27 " +
    "L 41 28 " +
    "C 44 20 51 17 59 21 " +
    "L 56 27 " +
    "C 51 25 48 27 46 30 " +
    "L 54 32 " +
    "L 52 38 " +
    "L 44 36 " +
    "L 39 51 Z";

  const E_PATH =
    "M 46 43 " +
    "C 47 34 53 29 61 31 " +
    "C 68 33 70 39 67 45 " +
    "L 52 42 " +
    "C 53 47 59 48 65 45 " +
    "L 68 50 " +
    "C 59 56 45 52 46 43 Z " +
    "M 53 38 " +
    "L 63 40 " +
    "C 64 37 62 35 59 35 " +
    "C 56 34 54 36 53 38 Z";

  const RING_LENGTH = 280;

  const [draw] = useState(
    () => new Animated.Value(animated ? 0 : 1),
  );

  // A separate value animates the gradient's position during the intro.
  const [gradientMotion] = useState(
    () => new Animated.Value(animated ? 0 : 1),
  );

  useEffect(() => {
    if (!animated) {
      draw.setValue(1);
      gradientMotion.setValue(1);
      return;
    }

    draw.setValue(0);
    gradientMotion.setValue(0);

    const ringAnimation = Animated.timing(draw, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });

    const colorAnimation = Animated.timing(gradientMotion, {
      toValue: 1,
      duration: 1400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });

    const animation = Animated.parallel([
      ringAnimation,
      colorAnimation,
    ]);

    animation.start();

    return () => animation.stop();
  }, [animated, draw, gradientMotion]);

  // Preserve the original theme palette.
  // Theme changes update these values automatically.
  const gradientStart = theme.colors.primaryDark;
  const gradientEnd = theme.colors.primary;
  const ringColor = theme.colors.secondaryLight;

  return (
    <View className="flex-row items-center">
      <Svg
        width={width}
        height={height}
        viewBox="0 0 100 74"
        fill="none"
      >
        <Defs>
          <LinearGradient
            id={gradientId}
            x1="10"
            y1="5"
            x2="88"
            y2="70"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={gradientStart} />
            <Stop offset="1" stopColor={gradientEnd} />
          </LinearGradient>
        </Defs>

        {/*
          The ring is stroked and animated using a dash offset,
          preserving the draw-on effect from the original component.
        */}
        <AnimatedPath
          d={RING_PATH}
          stroke={ringColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${RING_LENGTH} ${RING_LENGTH}`}
          strokeDashoffset={draw.interpolate({
            inputRange: [0, 1],
            outputRange: [RING_LENGTH, 0],
          })}
          opacity={0.95}
        />

        {/*
          The C-shaped brand mark and both letterforms share the
          theme gradient. There is no background rectangle.
        */}
        <Path
          d={RING_PATH}
          fill={`url(#${gradientId})`}
        />

        <Path
          d={F_PATH}
          fill={`url(#${gradientId})`} 
        />

        <Path
          d={E_PATH}
          fill={`url(#${gradientId})`}
         
        />
      </Svg>

      {showWordmark && (
        <Text
          className="ml-2.5 text-xl font-bold tracking-tight text-text dark:text-dark-text"
          style={{ backgroundColor: "transparent" }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          CFE
        </Text>
      )}
    </View>
  );
}
