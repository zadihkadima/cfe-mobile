import { screen } from "@testing-library/react-native";

import { renderScreen } from "@/test-utils/renderScreen";
import { api } from "@/core/api/client";

import { EditMyProfileScreen } from "./EditMyProfileScreen";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/user/profile/edit",
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("@/core/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const get = api.get as jest.Mock;

const profile = {
  id: "u-1",
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@acme.test",
  role: "client",
  is_active: true,
  invited: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  get.mockReset();

  // The layout fetches notifications for its badges, so a test that mocks only
  // the profile hands the badge code a profile and watches it fall over.
  get.mockImplementation((url: string) =>
    url.includes("notification")
      ? Promise.resolve({ data: { items: [], unread: 0, total: 0 } })
      : Promise.resolve({ data: profile }),
  );
});

function respondWithProfile(overrides: Record<string, unknown> = {}) {
  get.mockImplementation((url: string) =>
    url.includes("notification")
      ? Promise.resolve({ data: { items: [], unread: 0, total: 0 } })
      : Promise.resolve({ data: { ...profile, ...overrides } }),
  );
}

const signedIn = {
  preloadedState: {
    auth: {
      user: { id: "u-1", email: "ada@acme.test", role: "client" as const },
      hydrated: true,
    },
  },
};

describe("EditMyProfileScreen", () => {
  // The screen previously rendered a bare View, so it had no header and no way
  // to reach the menu -- reaching it meant a dead end with only the hardware
  // back button out.
  it("keeps the app header and its menu", async () => {
    await renderScreen(<EditMyProfileScreen />, signedIn);

    await screen.findByText("Edit");

    expect(screen.getByLabelText("Open menu")).toBeTruthy();
  });

  it("offers a way back to the profile", async () => {
    await renderScreen(<EditMyProfileScreen />, signedIn);

    // Awaited rather than read after the breadcrumb, which renders while the
    // profile is still loading and so says nothing about the form.
    expect(await screen.findByText("Cancel")).toBeTruthy();
  });

  describe("the profile photo", () => {
    it("invites a photo when the account has none", async () => {
      await renderScreen(<EditMyProfileScreen />, signedIn);

      expect(await screen.findByLabelText("Add a profile photo")).toBeTruthy();
    });

    // Offering "Add photo" to someone who has one suggests they can have two.
    it("offers to replace one that is already set", async () => {
      respondWithProfile({ avatar_url: "https://api.test/avatar" });

      await renderScreen(<EditMyProfileScreen />, signedIn);

      expect(
        await screen.findByLabelText("Change profile photo"),
      ).toBeTruthy();
    });
  });
});
