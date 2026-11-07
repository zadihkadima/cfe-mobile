import { screen } from "@testing-library/react-native";

import { renderScreen } from "@/test-utils/renderScreen";
import { api } from "@/core/api/client";
import { Text } from "react-native";

import { SharedLayout } from "./SharedLayout";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/user/profile",
}));

jest.mock("@/core/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const get = api.get as jest.Mock;

const signedIn = {
  preloadedState: {
    auth: {
      user: { id: "u-1", email: "ada@acme.test", role: "client" as const },
      hydrated: true,
    },
  },
};

beforeEach(() => {
  get.mockReset();
});

describe("SharedLayout", () => {
  it("renders its content and the app chrome", async () => {
    get.mockResolvedValue({ data: { items: [], unread: 0, total: 0 } });

    await renderScreen(
      <SharedLayout title="Profile">
        <Text>the page</Text>
      </SharedLayout>,
      signedIn,
    );

    expect(await screen.findByText("the page")).toBeTruthy();
    expect(screen.getByLabelText("Open menu")).toBeTruthy();
  });

  // The unread badge used to read `notifications?.items.filter(...)`. The
  // optional chain stopped at the response, so a payload without an items
  // array threw and took down not just the badge but the whole screen.
  it("still renders when the notification payload has no items", async () => {
    get.mockResolvedValue({ data: { unread: 0 } });

    await renderScreen(
      <SharedLayout title="Profile">
        <Text>the page</Text>
      </SharedLayout>,
      signedIn,
    );

    expect(await screen.findByText("the page")).toBeTruthy();
  });

  // Every icon in the header was previously unlabelled, so a screen reader
  // announced the row as anonymous buttons and finding the menu meant guessing.
  it("names every control in the header", async () => {
    get.mockResolvedValue({ data: { items: [], unread: 0, total: 0 } });

    await renderScreen(
      <SharedLayout title="Profile">
        <Text>the page</Text>
      </SharedLayout>,
      signedIn,
    );

    await screen.findByText("the page");

    expect(screen.getByLabelText("Open menu")).toBeTruthy();
    expect(screen.getByLabelText("Messages")).toBeTruthy();
    expect(screen.getByLabelText("Notifications")).toBeTruthy();
    expect(screen.getByLabelText("Switch to dark mode")).toBeTruthy();
  });

  // A badge is a visual count. Without it in the label a screen reader hears
  // "Messages" whether there are none or nine.
  it("says how many are unread rather than only showing a badge", async () => {
    get.mockImplementation((url: string) => {
      if (url.includes("unread-by-workspace")) {
        return Promise.resolve({
          data: {
            items: [{ workspace_id: "w1", total: 5, by_kind: { message: 2 } }],
            total: 5,
            by_kind: { message: 2, task: 3 },
          },
        });
      }

      // The general list already excludes conversation traffic, so this is
      // three things that are not messages.
      return Promise.resolve({ data: { items: [], unread: 3, total: 3 } });
    });

    await renderScreen(
      <SharedLayout title="Profile">
        <Text>the page</Text>
      </SharedLayout>,
      signedIn,
    );

    expect(await screen.findByLabelText("Messages, 2 unread")).toBeTruthy();

    // Three, and messages are not taken off it again. Messages have their own
    // icon beside the bell, so counting them in both made one new message
    // light up two badges and left the bell showing a number that reading the
    // message would not clear. That used to be corrected by subtracting here;
    // the server now leaves them out of the list, so subtracting as well would
    // take the same two off twice and show one.
    expect(screen.getByLabelText("Notifications, 3 unread")).toBeTruthy();
  });

  // The division has to be asked for, not assumed. If the request went
  // unscoped the bell would show every message in the app as a general
  // notification, and the list behind it would be nothing but conversation.
  it("asks for the general list rather than everything", async () => {
    get.mockImplementation((url: string) => {
      if (url.includes("unread-by-workspace")) {
        return Promise.resolve({
          data: { items: [], total: 0, by_kind: {} },
        });
      }

      return Promise.resolve({ data: { items: [], unread: 0, total: 0 } });
    });

    await renderScreen(
      <SharedLayout title="Profile">
        <Text>the page</Text>
      </SharedLayout>,
      signedIn,
    );

    await screen.findByLabelText("Notifications");

    expect(get).toHaveBeenCalledWith(
      "/notifications",
      expect.objectContaining({ params: { scope: "general" } }),
    );
  });

  // The count used to be produced by filtering the notification list, which
  // the server caps at fifty rows -- so it silently stopped growing for
  // exactly the person a badge is meant to help.
  it("counts beyond what one page of the notification list could hold", async () => {
    get.mockImplementation((url: string) => {
      if (url.includes("unread-by-workspace")) {
        return Promise.resolve({
          data: {
            items: [
              { workspace_id: "w1", total: 250, by_kind: { message: 250 } },
            ],
            total: 250,
            by_kind: { message: 250 },
          },
        });
      }

      // The list itself returns only a page, as it always did.
      return Promise.resolve({ data: { items: [], unread: 250, total: 250 } });
    });

    await renderScreen(
      <SharedLayout title="Profile">
        <Text>the page</Text>
      </SharedLayout>,
      signedIn,
    );

    expect(await screen.findByLabelText("Messages, 250 unread")).toBeTruthy();
  });
});
