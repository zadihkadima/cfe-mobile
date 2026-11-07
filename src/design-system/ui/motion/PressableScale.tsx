import { PropsWithChildren } from "react";
import {
  Pressable,
  PressableProps,
} from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

import clsx from "clsx";

const AnimatedPressable =
  Animated.createAnimatedComponent(Pressable);

interface Props
  extends PropsWithChildren<PressableProps> {

  /**
   * How far to compress on press. The default suits a row or a card; small
   * targets need less, because the same ratio moves fewer pixels and reads as
   * a twitch rather than a press.
   */
  scaleTo?: number;

  className?: string;

}

/**
 * A pressable that compresses slightly while held.
 *
 * Touch has no hover, so the only moment a user can be told their finger landed
 * on the right thing is the press itself. The app currently answers with an
 * opacity drop, which is legible but reads as the element dimming — as though
 * it were becoming unavailable — rather than yielding. A small inward scale
 * reads as physical, and it is the difference between an interface that
 * responds and one that merely reacts.
 *
 * The scale runs as a worklet on the UI thread. That is the whole point: press
 * feedback arrives while the JavaScript thread is busy starting whatever the
 * press triggered, which is exactly when a JS-driven animation would drop
 * frames. Feedback that stutters is worse than none, because it makes a
 * working app feel broken.
 */
export function PressableScale({

  children,

  scaleTo = 0.97,

  disabled,

  className,

  ...props

}: Props) {

  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({

    transform: [
      {
        scale: 1 - pressed.value * (1 - scaleTo),
      },
    ],

  }));

  // Asymmetric on purpose. The press must register immediately or it feels
  // laggy; the release is allowed to settle, which is what makes it read as
  // springing back rather than snapping.
  const press = (value: number, duration: number) => {

    pressed.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.quad),
    });

  };

  return (

    <AnimatedPressable

      // Spread first so the handlers and style below win. Spreading last would
      // silently drop the animation the moment a caller passed its own
      // `onPressIn`, and the failure would look like the component simply not
      // working rather than a props conflict.
      {...props}

      disabled={disabled}

      onPressIn={(event) => {

        if (!disabled) {
          press(1, 90);
        }

        props.onPressIn?.(event);

      }}

      onPressOut={(event) => {

        press(0, 160);

        props.onPressOut?.(event);

      }}

      style={animatedStyle}

      className={clsx(

        disabled && "opacity-50",

        className,

      )}

    >

      {children}

    </AnimatedPressable>

  );

}
