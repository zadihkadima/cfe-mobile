import { router } from "expo-router";

import { logoutRequest } from "@/core/api/auth";

import { store } from "@/core/store";
import { logout } from "@/core/store/authSlice";
import { showError } from "@/core/store/notificationSlice";
import { authStorage } from "@/core/storage/authStorage";
import { withdrawPushDevice } from "@/modules/settings/hooks/usePushRegistration";

import { tokenService } from "./tokenService";

/**
 * Ends the session, on this device and on the server.
 *
 * This sequence — revoke the session, clear tokens, clear the cached user,
 * reset the store, send the user to the sign-in screen — was previously
 * repeated at four separate points in the request interceptor and the bootstrap
 * routine. Duplicating it meant each copy could drift, and a copy that forgot
 * one step would leave the app in a state where the user appears signed out
 * while a usable credential is still on the device.
 *
 * Clearing tokens locally is not by itself a sign-out. The refresh token stays
 * valid server-side for thirty days, so without revoking it a copy taken from a
 * backup or a shared device would keep working long after the user believed
 * they had signed out.
 *
 * Ordering matters twice over. The refresh token is read before it is
 * destroyed, because revoking needs it. Credentials are then destroyed before
 * navigation, so a request fired during the transition cannot pick up a token
 * that is on its way out.
 *
 * Only the refresh token is sent. This function is called most often *because*
 * the access token has expired, so authorizing the revocation with one would
 * mean the sign-out failed in precisely the case it exists for, leaving the
 * refresh token live for the rest of its thirty days.
 *
 * The revocation is deliberately not awaited. Local teardown must be immediate
 * and unconditional: someone signing out on a failing connection, or because
 * their session already expired, must still be signed out here and now. A
 * failure is swallowed because there is no action the user could usefully take
 * in response, and in the common cases the token is already invalid anyway.
 */
export function endSession(reason?: string): void {
  const refreshToken = tokenService.getRefreshToken();

  if (refreshToken) {
    void logoutRequest(refreshToken).catch(() => {
      // Intentionally ignored; see the note above.
    });
  }

  /*
   * Withdraw this handset from push, for the same reason and on the same
   * terms as the revocation above: not awaited, and never allowed to fail.
   *
   * Left registered, the next person to sign in on this device would keep
   * receiving the previous one's notifications. On a shared or handed-down
   * phone that is a disclosure rather than an annoyance.
   *
   * Called before the token is cleared, because withdrawing needs to be
   * authenticated as the person doing the leaving.
   */
  void withdrawPushDevice();

  tokenService.clear();
  authStorage.clearUser();

  store.dispatch(logout());

  if (reason) {
    store.dispatch(showError(reason));
  }

  router.replace("/auth/login");
}

/** The message shown whenever a session ends because it is no longer valid. */
export const SESSION_EXPIRED_MESSAGE =
  "Your session expired. Please sign in again.";
