import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { View } from "react-native";

import { DrawerItem } from "./DrawerItem";

jest.mock("expo-router", () => ({
  usePathname: () => "/user/messages",
  useRouter: () => ({
    navigate: jest.fn(),
  }),
}));

/** A stand-in for the lucide icons the real menu passes. */
function Icon() {
  return <View testID="icon" />;
}

const item = {
  title: "Messages",
  href: "/user/messages",
  icon: Icon,
};

describe("DrawerItem", () => {
  /**
   * The regression this file exists for.
   *
   * `{item.badge && <View>…</View>}` evaluates to the number 0 when the count
   * is zero, and React Native renders a bare number as a text node outside any
   * <Text>, which throws "Text strings must be rendered within a <Text>
   * component". The throw happens during render, so it took the whole
   * drawer with it and the menu simply failed to open.
   *
   * Unread counts are zero most of the time, so this was the ordinary case
   * rather than an edge one -- and TypeScript cannot see it, since `number &&
   * JSX` is a perfectly well-typed expression. Only a render catches it,
   * which is why this asserts the row survives rather than asserting
   * anything about the badge.
   */
  it("still renders the row when the badge count is zero", async () => {
    await render(
      <DrawerItem item={{ ...item, badge: 0 }} onPress={jest.fn()} />,
    );

    expect(screen.getByText("Messages")).toBeTruthy();
  });

  it("draws no badge when the count is zero", async () => {
    await render(<DrawerItem item={{ ...item, badge: 0 }} onPress={jest.fn()} />);

    // A pill reading "0" is worse than no pill: the badge exists to draw the
    // eye, and one that is always present stops meaning anything.
    expect(screen.queryByText("0")).toBeNull();
  });

  it("draws no badge when there is no count at all", async () => {
    await render(<DrawerItem item={item} onPress={jest.fn()} />);

    expect(screen.queryByText("0")).toBeNull();
    expect(screen.getByText("Messages")).toBeTruthy();
  });

  it("draws the count when there is one", async () => {
    await render(<DrawerItem item={{ ...item, badge: 3 }} onPress={jest.fn()} />);

    expect(screen.getByText("3")).toBeTruthy();
  });

  it("caps a large count so it cannot spill out of the row", async () => {
    await render(<DrawerItem item={{ ...item, badge: 1204 }} onPress={jest.fn()} />);

    // The badge is a fixed-height pill sitting at the trailing edge. A four
    // digit count pushes the title out of the row it belongs to.
    expect(screen.getByText("99+")).toBeTruthy();
    expect(screen.queryByText("1204")).toBeNull();
  });

  it("closes the drawer when the row is chosen", async () => {
    const onPress = jest.fn();

    await render(<DrawerItem item={item} onPress={onPress} />);

    await fireEvent.press(screen.getByText("Messages"));

    // Navigation now goes through `useRouter().replace` inside DrawerItem.
    // If the drawer did not also close, the destination would open behind a
    // menu still covering it.
    expect(onPress).toHaveBeenCalled();
  });
});
