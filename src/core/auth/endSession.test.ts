import { router } from "expo-router";

import { logoutRequest } from "@/core/api/auth";

import { store } from "@/core/store";
import { authStorage } from "@/core/storage/authStorage";
import { storage } from "@/core/storage/mmkv";

import { endSession, SESSION_EXPIRED_MESSAGE } from "./endSession";
import { tokenService } from "./tokenService";

// Signing out reaches the server to revoke the refresh token. That call is
// stubbed here so these tests stay about local teardown; the revocation itself
// is asserted separately below.
jest.mock("@/core/api/auth", () => ({
  logoutRequest: jest.fn().mockResolvedValue(undefined),
}));

const replace = router.replace as jest.Mock;

/**
 * Signing out used to be four separate copies of the same sequence, in the
 * request interceptor and the bootstrap routine. Duplicated teardown is
 * dangerous in a way duplicated rendering is not: a copy that omits one step
 * leaves the app *looking* signed out while a usable bearer token is still on
 * the device, so the next code path that reads storage directly is authorised
 * as a user who believes they have left.
 *
 * These tests pin the whole sequence, and in particular the ordering: the
 * credential must be destroyed before navigation, so a request fired during
 * the transition cannot pick up a token that is on its way out.
 */
describe("endSession", () => {
  beforeEach(() => {
    storage.clear();
    tokenService.setTokens("access-token", "refresh-token");
    authStorage.setUser({ id: "1", role: "client" });
  });

  it("destroys both tokens", () => {
    endSession();

    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
  });

  it("clears the cached user profile", () => {
    endSession();

    expect(authStorage.getUser()).toBeNull();
  });

  it("resets the Redux auth state", () => {
    endSession();

    expect(store.getState().auth.user).toBeNull();
  });

  it("sends the user to the sign-in screen", () => {
    endSession();

    expect(replace).toHaveBeenCalledWith("/auth/login");
  });

  it("destroys the credential before navigating away", () => {
    // If navigation happened first, a screen unmount or an in-flight retry
    // could still read a live token from storage.
    let tokenAtNavigation: string | null = "not captured";

    replace.mockImplementation(() => {
      tokenAtNavigation = tokenService.getAccessToken();
    });

    endSession();

    expect(tokenAtNavigation).toBeNull();
  });

  it("shows an explanation when the session ended involuntarily", () => {
    endSession(SESSION_EXPIRED_MESSAGE);

    const { notification } = store.getState();

    expect(JSON.stringify(notification)).toContain(SESSION_EXPIRED_MESSAGE);
  });

  it("stays silent on a deliberate sign-out", () => {
    // A user who taps "Sign out" does not need to be told their session ended.
    const before = JSON.stringify(store.getState().notification);

    endSession();

    expect(JSON.stringify(store.getState().notification)).toBe(before);
  });

  it("revokes the session on the server", async () => {
    // Clearing tokens locally is not a sign-out. The refresh token stays valid
    // server-side for thirty days, so a copy taken from a device backup or a
    // shared machine would keep working unless it is revoked.
    endSession();

    expect(logoutRequest).toHaveBeenCalledWith("refresh-token");
  });

  it("still revokes when the access token has expired", () => {
    // This is the common case, not an edge case: the session is usually being
    // ended *because* the access token expired. Authorizing the revocation
    // with one would refuse the sign-out exactly when it is most needed and
    // leave the refresh token live for the rest of its thirty days.
    storage.clear();
    tokenService.setTokens("", "refresh-token");
    (logoutRequest as jest.Mock).mockClear();

    endSession(SESSION_EXPIRED_MESSAGE);

    expect(logoutRequest).toHaveBeenCalledWith("refresh-token");
  });

  it("reads the token before destroying it", () => {
    // The revocation needs the very credential the teardown deletes. If the
    // order were reversed the request would go out empty and silently revoke
    // nothing, leaving the session alive while appearing to succeed.
    endSession();

    const [sentRefresh] = (logoutRequest as jest.Mock).mock.calls[0] ?? [];

    expect(sentRefresh).toBe("refresh-token");
  });

  it("signs the user out even when the server cannot be reached", async () => {
    // A user on a failing connection, or one whose session has already
    // expired, must still be signed out. Waiting on the network here would
    // leave a usable credential on the device for as long as the request hung.
    (logoutRequest as jest.Mock).mockRejectedValueOnce(
      new Error("network unreachable"),
    );

    expect(() => endSession()).not.toThrow();

    expect(tokenService.getAccessToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
    expect(replace).toHaveBeenCalledWith("/auth/login");
  });

  it("does not call the server when there is nothing to revoke", () => {
    // Bootstrapping with no stored session must not fire a pointless request
    // carrying undefined credentials.
    tokenService.clear();
    (logoutRequest as jest.Mock).mockClear();

    endSession();

    expect(logoutRequest).not.toHaveBeenCalled();
  });

  it("is safe to call twice", () => {
    // Several failing requests can resolve their 401s at once; each will call
    // this, and the second call must not throw or re-navigate incorrectly.
    endSession();

    expect(() => endSession()).not.toThrow();
    expect(tokenService.getAccessToken()).toBeNull();
  });
});
