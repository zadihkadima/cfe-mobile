import { act, render, screen } from "@testing-library/react-native";
import {
  Dimensions,
  Keyboard,
  Platform,
  Text,
  View,
  type KeyboardEvent as RNKeyboardEvent,
} from "react-native";

import { KeyboardAvoidingContainer } from "./KeyboardAvoidingContainer";

/**
 * Stands in for the native measurement.
 *
 * `measureInWindow` reports absolute window coordinates, which is the whole
 * point of using it here, so the fake reports a container positioned below the
 * chrome that React Native's own KeyboardAvoidingView would have ignored.
 */
function mockMeasureInWindow({ y, height }: { y: number; height: number }) {
  jest
    .spyOn(View.prototype, "measureInWindow")
    .mockImplementation((callback: (...args: number[]) => void) => {
      callback(0, y, 400, height);
    });
}

const listeners = new Map<string, (event: RNKeyboardEvent) => void>();

beforeEach(() => {
  listeners.clear();

  jest
    .spyOn(Keyboard, "addListener")
    .mockImplementation(((event: string, callback: (payload: RNKeyboardEvent) => void) => {
      listeners.set(event, callback);
      return { remove: () => listeners.delete(event) };
    }) as unknown as typeof Keyboard.addListener);
});

const WINDOW_HEIGHT = 800;

async function showKeyboardOfHeight(height: number) {
  await act(async () => {
    listeners.get("keyboardDidShow")?.({
      endCoordinates: { screenY: 0, height, width: 400, screenX: 0 },
    } as RNKeyboardEvent);
  });
}

async function hideKeyboard() {
  await act(async () => {
    listeners.get("keyboardDidHide")?.({} as RNKeyboardEvent);
  });
}

function paddingBottom() {
  const style = screen.getByTestId("content").parent?.props.style as
    | { paddingBottom?: number }
    | undefined;

  return style?.paddingBottom;
}

async function renderContainer() {
  await render(
    <KeyboardAvoidingContainer>
      <View testID="content">
        <Text>composer</Text>
      </View>
    </KeyboardAvoidingContainer>,
  );
}

describe("KeyboardAvoidingContainer on Android", () => {
  const original = Platform.OS;

  beforeAll(() => {
    Platform.OS = "android";
  });

  beforeEach(() => {
    jest
      .spyOn(Dimensions, "get")
      .mockReturnValue({ height: WINDOW_HEIGHT, width: 400, scale: 2, fontScale: 2 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    Platform.OS = original;
  });

  it("reserves the full overlap, including the chrome above it", async () => {
    // The first regression this exists to prevent. React Native's own
    // KeyboardAvoidingView measures relative to its parent, so the 150px of
    // header above this container is missing from its sums and it reserves
    // that much too little -- which is why the composer stayed under the
    // keyboard while the messages above it moved.
    //
    // The container runs to the bottom of the window, so the keyboard covers
    // all 300px of its own height.
    mockMeasureInWindow({ y: 150, height: 650 });

    await renderContainer();
    await showKeyboardOfHeight(300);

    expect(paddingBottom()).toBe(300);
  });

  it("does not lose the status bar to a coordinate-space mismatch", async () => {
    // The second regression, and the subtler one. `measureInWindow` reports
    // window coordinates; the keyboard's `screenY` is a screen coordinate.
    // Subtracting one from the other quietly drops the status bar -- about
    // 24dp, which is roughly half a text field, and exactly what was left
    // under the keyboard.
    //
    // Everything here is window space, so the status bar cannot go missing:
    // the container still ends at the window's bottom edge, and the full
    // keyboard height is reserved.
    mockMeasureInWindow({ y: 24, height: WINDOW_HEIGHT - 24 });

    await renderContainer();
    await showKeyboardOfHeight(300);

    expect(paddingBottom()).toBe(300);
  });

  it("reserves only what the keyboard actually covers", async () => {
    // A container that stops short of the window's bottom edge is already
    // clear of part of the keyboard, and reserving the full height would lift
    // it further than the keyboard ever reached.
    mockMeasureInWindow({ y: 150, height: 550 });

    await renderContainer();
    await showKeyboardOfHeight(300);

    // 100px of the keyboard sits below this container; only 200 overlaps it.
    expect(paddingBottom()).toBe(200);
  });

  it("reserves nothing when the window has already resized", async () => {
    // Some Android versions shorten the window themselves. Reserving the
    // keyboard's height on top of that would strand the composer halfway up
    // the screen.
    mockMeasureInWindow({ y: 150, height: 350 });

    await renderContainer();
    await showKeyboardOfHeight(300);

    expect(paddingBottom()).toBe(0);
  });

  it("reserves nothing once the keyboard closes", async () => {
    mockMeasureInWindow({ y: 150, height: 650 });

    await renderContainer();
    await showKeyboardOfHeight(300);

    await hideKeyboard();

    expect(paddingBottom()).toBe(0);
  });
});
