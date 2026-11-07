
import { useEffect, useId, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

// import { useTheme } from "@/design-system/theme/useTheme";

interface Props {
  size?: number;
  showWordmark?: boolean;
  animated?: boolean;
}

const AnimatedView = Animated.View;

export function LogoFixedColor({
  size = 32,
  showWordmark = false,
  animated = false,
}: Props) {
  // const { theme } = useTheme();
  const instanceId = useId().replace(/:/g, "");
  const gradientId = `fe-logo-gradient-${instanceId}`;

  const [progress] = useState(
    () => new Animated.Value(animated ? 0 : 1),
  );

  useEffect(() => {
    if (!animated) {
      progress.setValue(1);
      return;
    }

    progress.setValue(0);

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [animated, progress]);

  // Original logo proportions: approximately 1.35 times wider than tall.
  const height = size;
  const width = size * (1419 / 1050);

  // Keep the logo's cyan-to-blue brand gradient independent of the UI theme.
  const opacity = progress;
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  return (
    <View className="flex-row items-center">
      <AnimatedView
        style={{
          width,
          height,
          opacity,
          transform: [{ scale }],
        }}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 74"
          fill="none"
        >
          <Defs>
            <LinearGradient
              id={gradientId}
              x1="15"
              y1="5"
              x2="76"
              y2="72"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#12C8EE" />
              <Stop offset="0.48" stopColor="#079BFA" />
              <Stop offset="1" stopColor="#0758E9" />
            </LinearGradient>
          </Defs>

          {/*
            The C-shaped ring is a filled vector path.
            Its center and surrounding background remain transparent.
          */}
          <Path
            d="
              M93 34
              C90 19 76 7 58 4
              C36 0 15 10 7 27
              C-1 44 8 61 25 69
              C43 77 66 72 82 59
              L91 48
              L76 44
              C64 55 51 59 38 54
              C26 49 21 39 25 29
              C29 19 40 14 52 15
              C64 16 71 22 76 28
              Z
            "
            fill={`url(#${gradientId})`}
          />

          {/*
            Custom vector f glyph. The crossbar and stem are paths,
            so the logo does not depend on an installed font.
          */}
          <Path
            d="
              M36.7 44.7
              L42.2 29.6
              L38.1 29
              L39.2 25.8
              L43.5 26.4
              C46.1 19.8 52.1 17
              59.5 20.1
              L57.8 23.6
              C53.2 21.9 49.7 23.6 48.4 27.1
              L56.1 28.2
              L54.9 31.5
              L47.2 30.4
              L41.9 45.5
              Z
            "
            fill={`url(#${gradientId})`}
          />

          {/*
            Custom vector e glyph with a transparent counter.
            evenOdd preserves the opening in the letter.
          */}
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="
              M47.2 38.1
              C48.4 29.7 54.6 26.1 61.2 28
              C67.8 29.8 70.1 35.4 67.3 41.1
              L52.5 38.9
              C52.2 43.2 57.6 45.5 63.8 42.3
              L66.2 45.7
              C58.4 51.1 45.9 47.1 47.2 38.1
              Z

              M53.7 35.2
              L63.2 36.6
              C63.8 33.9 61.9 32.1 59.4 31.7
              C56.8 31.3 54.6 32.6 53.7 35.2
              Z
            "
            fill={`url(#${gradientId})`}
          />
        </Svg>
      </AnimatedView>

      {showWordmark && (
        <Text
          className="ml-2.5 text-xl font-bold tracking-tight text-text dark:text-dark-text"
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          CFE
        </Text>
      )}
    </View>
  );
}
