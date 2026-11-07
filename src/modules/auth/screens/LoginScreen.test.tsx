import { LoginScreen } from "./LoginScreen";
import { renderScreen } from "@/test-utils/renderScreen";
import { screen, fireEvent, waitFor } from "@testing-library/react-native";
import { api } from "@/core/api/client";

/**
 * The router mock in `jest.setup.js` returns a fresh object from every
 * `useRouter()` call, so assertions against it would inspect a different
 * instance than the component used. A stable instance is required here because
 * these tests are largely *about* where the user is sent.
 *
 * The `mock` prefix is mandatory rather than stylistic: `jest.mock` is hoisted
 * above these declarations, and the factory is only permitted to close over
 * variables whose names begin with `mock`.
 */
const mockReplace = jest.fn();
const mockPush = jest.fn();

/**
 * Where the screen links to.
 *
 * The `Link` mock renders its child directly so `asChild` behaves as it does
 * at runtime, which means the destination never reaches the tree. Recording it
 * here is the only way to assert it. The `mock` prefix is required for the
 * same hoisting reason as the functions above.
 */
const mockHrefs: string[] = [];

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: jest.fn() }),
  router: { replace: mockReplace, push: mockPush, back: jest.fn() },
  usePathname: () => "/",
  useLocalSearchParams: () => ({}),
  // `Link` renders its child directly so `asChild` behaves as it does at
  // runtime without pulling in the navigation tree.
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
    mockHrefs.push(String(href));
    return children;
  },
}));

beforeEach(() => {
  mockHrefs.length = 0;
});

jest.mock("@/core/api/client", () => ({
  api: { post: jest.fn(), get: jest.fn() },
}));

const post = api.post as jest.Mock;

/**
 * Fields are addressed by their accessible label.
 *
 * These queries used to go through placeholder text, because `FormInput`
 * rendered its label as a sibling `Text` with no association to the input:
 * a screen reader announced both fields as unlabelled edit boxes, and
 * `getByLabelText` had nothing to match. Now that the label is wired up, the
 * tests reach the fields the same way an assistive technology does -- so if
 * that association is ever removed, these fail rather than passing quietly
 * against markup no screen reader can navigate.
 */
const EMAIL = "Email Address";
const PASSWORD = "Password";

/**
 * `fireEvent` returns a promise in Testing Library v14 and must be awaited, or
 * the assertion runs before React has processed the event.
 */
async function fillAndSubmit(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText(EMAIL), email);
  await fireEvent.changeText(screen.getByLabelText(PASSWORD), password);
  await fireEvent.press(screen.getByText("Sign In"));
}

const tokens = { access_token: "access", refresh_token: "refresh" };

describe("LoginScreen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    post.mockReset();
  });

  it("renders the sign-in form", async () => {
    await renderScreen(<LoginScreen />);

    expect(screen.getByLabelText(EMAIL)).toBeTruthy();
    expect(screen.getByLabelText(PASSWORD)).toBeTruthy();
    expect(screen.getByText("Sign In")).toBeTruthy();
  });

  describe("validation", () => {
    it("rejects a malformed email without calling the API", async () => {
      await renderScreen(<LoginScreen />);

      await fillAndSubmit("not-an-email", "correct-horse");

      expect(await screen.findByText("Invalid email address")).toBeTruthy();
      // The point of client-side validation is that the request never leaves.
      expect(post).not.toHaveBeenCalled();
    });

    it("rejects a short password without calling the API", async () => {
      await renderScreen(<LoginScreen />);

      await fillAndSubmit("user@example.com", "short");

      expect(
        await screen.findByText("Password must be at least 8 characters"),
      ).toBeTruthy();
      expect(post).not.toHaveBeenCalled();
    });
  });

  describe("routing after a successful sign-in", () => {
    /**
     * Each role lands on its own area. This is a usability affordance rather
     * than an access control -- the backend is what actually refuses a client
     * who asks for an admin route -- but sending a client to the admin shell
     * would present a screen of failed requests and look like a breach to the
     * person looking at it.
     */
    it.each([
      ["admin", "/user/admin"],
      ["manager", "/user/manager"],
      ["client", "/user/client"],
    ])("sends a %s to %s", async (role, destination) => {
      post.mockResolvedValue({ data: { ...tokens, user: { role } } });

      await renderScreen(<LoginScreen />);
      await fillAndSubmit("user@example.com", "correct-horse");

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(destination));
    });

    it("sends an unrecognised role to the client area rather than the admin area", async () => {
      // Failing closed matters here: a role the client does not know about is
      // more likely to be a new *lower*-privileged role than a new higher one,
      // and defaulting upward would be the wrong guess to make.
      post.mockResolvedValue({ data: { ...tokens, user: { role: "auditor" } } });

      await renderScreen(<LoginScreen />);
      await fillAndSubmit("user@example.com", "correct-horse");

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/user/client"));
      expect(mockReplace).not.toHaveBeenCalledWith("/user/admin");
    });
  });

  describe("two-factor challenge", () => {
    it("goes to the code prompt and does not sign the user in", async () => {
      post.mockResolvedValue({
        data: {
          requires_two_factor: true,
          challenge_id: "challenge-1",
          email: "user@example.com",
        },
      });

      await renderScreen(<LoginScreen />);
      await fillAndSubmit("user@example.com", "correct-horse");

      await waitFor(() =>
        expect(mockPush).toHaveBeenCalledWith({
          pathname: "/auth/two-factor",
          params: { challenge: "challenge-1", email: "user@example.com" },
        }),
      );

      // The critical half of the assertion: a challenged sign-in must not also
      // land the user inside the app.
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe("failure", () => {
    it("shows an error and stays on the screen when the credentials are rejected", async () => {
      post.mockRejectedValue(new Error("401"));

      await renderScreen(<LoginScreen />);
      await fillAndSubmit("user@example.com", "wrong-password");

      expect(
        await screen.findByText("Login failed. Please try again."),
      ).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("does not reveal whether the email or the password was wrong", async () => {
      // Distinguishing the two turns the login form into an account-existence
      // oracle, which is how a credential-stuffing list gets cheaply filtered.
      post.mockRejectedValue({
        response: { status: 401, data: { message: "user not found" } },
      });

      await renderScreen(<LoginScreen />);
      await fillAndSubmit("user@example.com", "wrong-password");

      await screen.findByText("Login failed. Please try again.");
      expect(screen.queryByText(/user not found/i)).toBeNull();
      expect(screen.getByText("Failed sign-in attempts in this session: 1. Check your password before trying again.")).toBeTruthy();
    });

    it("directs a locked user to support instead of inviting more password attempts", async () => {
      post.mockRejectedValue({
        response: {
          status: 403,
          data: { code: "account_locked", error: "untrusted backend detail" },
        },
      });

      await renderScreen(<LoginScreen />);
      await fillAndSubmit("user@example.com", "wrong-password");

      expect(
        await screen.findByText(/Contact support at support@cfe\.example/i),
      ).toBeTruthy();
      expect(screen.queryByText(/untrusted backend detail/i)).toBeNull();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.queryByText(/Failed sign-in attempts in this session/i)).toBeNull();
    });
  });

  describe("invitation", () => {
    it("offers a way in for someone who was invited but has no account yet", async () => {
      // An invited user cannot sign in, so the only place this can be reached
      // is a screen that does not require a session. The emailed deep link
      // covers the phone; this covers everyone whose mail client will not open
      // it, which on a desktop is all of them.
      await renderScreen(<LoginScreen />);

      expect(screen.getByText("Accept your invitation")).toBeTruthy();
      expect(mockHrefs).toContain("/auth/accept-invite");
    });

    it("does not require a token in the route to get there", async () => {
      // Linking to the token form directly would strand anyone typing the code
      // by hand, which is the case this exists for.
      await renderScreen(<LoginScreen />);

      // Deduplicated because a render pass may repeat, and what matters is
      // which destinations exist rather than how many times they were built.
      expect([
        ...new Set(
          mockHrefs.filter((href) => href.startsWith("/auth/accept-invite")),
        ),
      ]).toEqual(["/auth/accept-invite"]);
    });
  });
});
