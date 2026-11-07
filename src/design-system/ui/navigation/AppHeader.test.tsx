import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import { AppHeader } from "./AppHeader";

/**
 * The behaviour under test is "does this button say whether I am already
 * there", so the path has to be controllable per test rather than fixed by
 * the global expo-router mock.
 *
 * Named with the `mock` prefix because jest hoists `jest.mock` calls above
 * the imports, and its babel plugin rejects a factory closing over anything
 * not named this way -- the variable would otherwise be read before it is
 * initialised.
 */
let mockPathname = "/user/client";

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn() },
  usePathname: () => mockPathname,
}));

jest.mock("@/modules/notification/hooks/useNotifications", () => ({
  useNotifications: () => ({ data: { unread: 0 } }),
}));

jest.mock("@/modules/notification/hooks/useUnread", () => ({
  useUnread: () => ({ forKind: () => 0 }),
}));

function renderHeader() {
  const store = configureStore({
    reducer: {
      auth: () => ({
        user: { role: "client", first_name: "Ada", last_name: "Lovelace" },
      }),
    },
  });

  return render(
    <Provider store={store}>
      <AppHeader onMenu={jest.fn()} />
    </Provider>,
  );
}

describe("AppHeader", () => {
  describe("the messages and notifications buttons", () => {
    /**
     * These two are the only controls in the header a person can press while
     * already standing on the destination. Pressing one there does nothing --
     * correctly, since navigating to the current route would rebuild the
     * screen for no reason -- but with no indication of why, "nothing happens"
     * is indistinguishable from a broken button.
     */
    it("marks messages as selected on the messages screen", async () => {
      mockPathname = "/user/client/messages";

      await renderHeader();

      expect(
        screen.getByLabelText("Messages").props.accessibilityState.selected,
      ).toBe(true);
    });

    it("marks notifications as selected on the notifications screen", async () => {
      mockPathname = "/user/client/notifications";

      await renderHeader();

      expect(
        screen.getByLabelText("Notifications").props.accessibilityState.selected,
      ).toBe(true);
    });

    it("marks neither as selected elsewhere", async () => {
      mockPathname = "/user/client";

      await renderHeader();

      expect(
        screen.getByLabelText("Messages").props.accessibilityState.selected,
      ).toBe(false);
      expect(
        screen.getByLabelText("Notifications").props.accessibilityState.selected,
      ).toBe(false);
    });

    it("does not mark messages as selected in a workspace conversation", async () => {
      // A workspace thread is a different destination from the role's inbox,
      // and the button still moves you when pressed there. Matching on a
      // prefix would light it up and quietly turn the one control that
      // promises not to navigate into one that does.
      mockPathname = "/user/workspaces/42/messages";

      await renderHeader();

      expect(
        screen.getByLabelText("Messages").props.accessibilityState.selected,
      ).toBe(false);
    });
  });
});
