import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Whether the software keyboard is currently on screen.
 *
 * Needed because the bottom safe-area inset and the keyboard occupy the same
 * space but never at the same time. A composer padded by the inset while the
 * keyboard is up floats a gap the height of the home indicator above it, which
 * reads as a rendering fault; a composer without the inset while the keyboard
 * is down sits underneath the gesture bar, where part of it cannot be tapped.
 * Only one of the two is correct at any moment, so the answer has to be
 * observed rather than assumed.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // iOS reports will-show/will-hide, which fire before the animation and let
    // the layout move with the keyboard rather than after it. Android only
    // emits did-show/did-hide.
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

/**
 * The current keyboard height in screen pixels.
 *
 * Android's edge-to-edge mode can report a visible keyboard without shrinking
 * the React root. Consumers that pin controls to the bottom need this value
 * to reserve the physical space occupied by the keyboard rather than relying
 * on the activity's window-resize policy.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, (event) => {
      setHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
