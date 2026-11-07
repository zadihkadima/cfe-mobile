import { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, View } from "react-native";

type Props = PropsWithChildren<{
  className?: string;
}>;

/**
 * A full-height container that keeps its contents clear of the keyboard.
 *
 * Neither platform solves this for us, and they fail for different reasons.
 *
 * iOS never resizes the app for the keyboard -- it is drawn over the top --
 * but `KeyboardAvoidingView` handles that correctly, so iOS keeps using it.
 *
 * Android is the awkward one, and `KeyboardAvoidingView` is actively wrong
 * there. It reserves `frame.y + frame.height - keyboardY`, where `frame` comes
 * from `onLayout` and is therefore measured *relative to its parent*. Anything
 * stacked above this container -- the safe-area top inset, the app header, a
 * workspace tab bar -- is absent from `frame.y` yet present on screen, so the
 * view believes its bottom edge sits higher than it does and reserves too
 * little. That is the "lifts, but not far enough" failure: the messages move,
 * while the composer, the one control the keyboard exists to serve, stays
 * underneath it.
 *
 * Reserving the keyboard's reported height instead is not right either, because
 * it assumes the window did not resize. Whether an edge-to-edge Android window
 * resizes for the keyboard depends on the OS version and on how the activity
 * negotiates its insets, so anything derived from that assumption is correct on
 * some devices and wrong on others.
 *
 * So the overlap is measured, and measured entirely in one coordinate space.
 * That last part is not incidental: `measureInWindow` reports window
 * coordinates while the keyboard's `screenY` is a *screen* coordinate, and the
 * two differ by whatever sits above the window -- the status bar, typically
 * around 24dp. Subtracting one from the other silently loses exactly that much,
 * which is enough to leave the bottom half of a text field under the keyboard.
 *
 * Everything below is therefore in window space. The gap beneath this container
 * is `windowHeight - containerBottom`; the keyboard covers `keyboardHeight`
 * measured up from the same bottom edge. What the keyboard covers *of this
 * container* is the difference, and that is what gets reserved. If the window
 * did resize, the gap already accounts for it and the overlap falls to zero
 * rather than being reserved twice.
 */
export function KeyboardAvoidingContainer({ children, className }: Props) {
  const viewRef = useRef<View>(null);
  const [overlap, setOverlap] = useState(0);

  // Held so a re-measure after layout uses the height the last event reported,
  // rather than waiting for the keyboard to move again.
  const keyboardHeight = useRef(0);

  const measureOverlap = useCallback(() => {
    if (keyboardHeight.current === 0) {
      setOverlap(0);
      return;
    }

    viewRef.current?.measureInWindow((_x, y, _width, height) => {
      const windowHeight = Dimensions.get("window").height;
      const gapBelowContainer = windowHeight - (y + height);

      setOverlap(Math.max(0, keyboardHeight.current - gapBelowContainer));
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const show = Keyboard.addListener("keyboardDidShow", (event) => {
      keyboardHeight.current = event.endCoordinates.height;
      measureOverlap();
    });

    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardHeight.current = 0;
      setOverlap(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [measureOverlap]);

  if (Platform.OS === "android") {
    return (
      <View
        ref={viewRef}
        className={className}
        style={{ paddingBottom: overlap }}
        // The window may resize as the keyboard opens, which moves this
        // container's bottom edge after the keyboard event has been handled.
        // Re-measuring here settles on the truth either way.
        onLayout={measureOverlap}
      >
        {children}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className={className} behavior="padding">
      {children}
    </KeyboardAvoidingView>
  );
}
