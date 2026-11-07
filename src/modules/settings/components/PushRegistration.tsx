import { useSelector } from "react-redux";

import { RootState } from "@/core/store";

import { usePushRegistration, usePushTapNavigation } from "../hooks/usePushRegistration";

/**
 * Registers this installation for push once somebody is signed in.
 *
 * Mounted globally rather than on a screen, because a token has to be recorded
 * whether or not the person ever visits the settings. Gated on being signed in
 * rather than on app launch, because the token is stored against a person:
 * registering earlier would have nobody to attach it to.
 *
 * A component rather than a call inside the layout, so that the permission
 * prompt is not tied to the lifetime of the navigator.
 */
export function PushRegistration() {
  const signedIn = useSelector((state: RootState) => !!state.auth.user);

  usePushRegistration(signedIn);

  // Taps are handled here too, and gated on the same condition. Navigating to a
  // workspace before the session has restored would land on the sign-in screen
  // and lose the destination.
  usePushTapNavigation(signedIn);

  return null;
}
