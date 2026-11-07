import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import { renderScreen } from "@/test-utils/renderScreen";
import { api } from "@/core/api/client";

import { PushNotificationsScreen } from "./PushNotificationsScreen";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/user/settings/push",
}));

jest.mock("@/core/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const get = api.get as jest.Mock;
const put = api.put as jest.Mock;

const signedIn = {
  preloadedState: {
    auth: {
      user: { id: "u-1", email: "ada@acme.test", role: "client" as const },
      hydrated: true,
    },
  },
};

function settings(data: {
  kinds: Record<string, boolean>;
  available: string[];
}) {
  get.mockImplementation((url: string) => {
    if (url === "/push/settings") {
      return Promise.resolve({ data });
    }

    return Promise.resolve({ data: { items: [], unread: 0, total: 0 } });
  });
}

beforeEach(() => {
  get.mockReset();
  put.mockReset();
});

describe("PushNotificationsScreen", () => {
  it("draws a switch for every kind the server offers", async () => {
    // Driven by the server rather than by a list in the app, so that a kind
    // added on the backend becomes switchable without shipping a new app --
    // and so an administrator's extra kinds appear without the app knowing
    // which those are.
    settings({
      kinds: { message: true, task: false },
      available: ["message", "task"],
    });

    await renderScreen(<PushNotificationsScreen />, signedIn);

    expect(await screen.findByLabelText("Push notifications for messages")).toBeTruthy();
    expect(screen.getByLabelText("Push notifications for tasks")).toBeTruthy();
  });

  it("shows a kind it has no wording for rather than a blank row", async () => {
    // A kind added on the server before this app ships would otherwise render
    // as an empty row with a working switch, which is worse than an imperfect
    // label.
    settings({ kinds: { brand_new: true }, available: ["brand_new"] });

    await renderScreen(<PushNotificationsScreen />, signedIn);

    expect(await screen.findByLabelText("Push notifications for brand new")).toBeTruthy();
  });

  it("sends every choice when one switch moves", async () => {
    /*
      The server stores the map it is given, so sending only the switch that
      moved would erase every other choice -- and nothing would show it had
      happened until somebody noticed they had stopped being told about
      something.
    */
    settings({
      kinds: { message: true, task: true },
      available: ["message", "task"],
    });

    put.mockResolvedValue({
      data: { kinds: { message: false, task: true }, available: ["message", "task"] },
    });

    await renderScreen(<PushNotificationsScreen />, signedIn);

    const toggle = await screen.findByLabelText("Push notifications for messages");
    await waitFor(() => fireEvent(toggle, "valueChange", false));

    await waitFor(() => {
      expect(put).toHaveBeenCalledWith("/push/settings", {
        kinds: { message: false, task: true },
      });
    });
  });

  it("shows what the server stored rather than what was asked for", async () => {
    /*
      The server drops kinds the role is not offered. Keeping the optimistic
      value would leave a switch showing as on while the server has it off,
      and nothing would ever correct it.
    */
    settings({ kinds: { message: true }, available: ["message"] });

    put.mockResolvedValue({
      data: { kinds: { message: true }, available: ["message"] },
    });

    await renderScreen(<PushNotificationsScreen />, signedIn);

    const toggle = await screen.findByLabelText("Push notifications for messages");
    await waitFor(() => fireEvent(toggle, "valueChange", false));

    await waitFor(() => {
      expect(screen.getByLabelText("Push notifications for messages").props.value).toBe(true);
    });
  });
});
