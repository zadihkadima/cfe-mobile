import { useEffect } from "react";
import { Platform } from "react-native";

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

import { resolveEntityRoute } from "@/modules/notification/lib/notificationRoute";

import { forgetPushDevice, registerPushDevice } from "../api/push";

/**
 * What to do with a push that arrives while the app is open.
 *
 * Shown rather than swallowed. The alternative is that a notification sent
 * while somebody happens to have the app in front of them simply never
 * appears, which looks exactly like delivery being broken -- and it is the
 * case most likely to be hit while testing, so it would be reported as broken
 * before it ever reached anyone.
 */
Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
});

/** The token this installation last registered, so sign-out can withdraw it. */
let registeredToken: string | null = null;

/**
 * Asks for permission and returns a token, or null if there will not be one.
 *
 * Null is an ordinary outcome, not a failure: a simulator has no push
 * hardware, and somebody may simply have declined. Treating either as an error
 * would put a warning in front of a person who has already answered the
 * question.
 */
async function resolveToken(): Promise<string | null> {
  // A simulator cannot be issued a token, and asking produces an error rather
  // than a refusal.
  if (!Device.isDevice) {
    console.warn("push: no token, not a physical device");

    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;

  // Only ask if we have not been answered. Re-asking somebody who declined is
  // both futile -- the OS will not show the prompt twice -- and the reason
  // people uninstall.
  if (!granted && existing.canAskAgain) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }

  if (!granted) {
    /*
     * The two fields matter more than the message. If POST_NOTIFICATIONS is
     * missing from the manifest, Android reports the request as denied with
     * `canAskAgain` false -- indistinguishable from somebody having refused,
     * except that no amount of tapping will ever change it.
     */
    console.warn("push: no token, permission not granted", {
      canAskAgain: existing.canAskAgain,
      status: existing.status,
    });

    return null;
  }

  /*
   * Android will not display a notification that does not belong to a channel,
   * and creating one is idempotent. Without this, delivery succeeds and
   * nothing appears -- the most confusing failure available, because every
   * log says it worked.
   */
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Notifications",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  /*
   * The project id has to be passed explicitly in a bare build; without it the
   * token request fails at runtime with an error about being unable to work
   * out which project to issue for.
   *
   * Read through a narrow type because `extra` is untyped by definition -- it
   * is whatever the app config put there -- and an unchecked `any` here would
   * hand a number or an object straight to the token request.
   */
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;

  const projectId = extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return token.data;
}

/**
 * Registers this installation for push once somebody is signed in.
 *
 * Tied to being signed in rather than to app launch, because a token is
 * recorded against a person: registering before sign-in would have nobody to
 * attach it to, and registering once at launch would leave the previous
 * account receiving notifications after somebody else signed in.
 */
export function usePushRegistration(signedIn: boolean) {
  useEffect(() => {
    if (!signedIn) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await resolveToken();

        // The screen may have gone away while the OS was deciding.
        if (!token || cancelled) {
          return;
        }

        registeredToken = token;
        await registerPushDevice(token, Platform.OS);
      } catch (error) {
        /*
         * Swallowed on purpose. Push is an enhancement: the notification is
         * already in the app and the badge is already right. Interrupting a
         * sign-in with an error about push would make a working app look
         * broken over something the person did not ask for.
         *
         * Logged rather than discarded, and in release builds too, because
         * this is the only account anyone gets of why push is not working.
         * Gating it on __DEV__ would hide it in exactly the builds that are
         * shipped and tested on real handsets -- and a missing credential or
         * an unregistered package fails here, silently, on every launch.
         */
        console.warn("push: registration failed", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn]);
}

/**
 * Withdraws this installation, called when signing out.
 *
 * Otherwise the next person to sign in on this handset keeps receiving the
 * previous one's notifications -- on a shared or handed-down device that is a
 * disclosure, not an annoyance.
 *
 * Deliberately never throws: a sign-out that fails because push could not be
 * withdrawn would leave somebody signed in on a device they are trying to
 * leave.
 */
export async function withdrawPushDevice() {
  if (!registeredToken) {
    return;
  }

  const token = registeredToken;
  registeredToken = null;

  try {
    await forgetPushDevice(token);
  } catch {
    // Nothing to do about it here.
  }
}

/**
 * Opens the record a notification is about when it is tapped.
 *
 * Without this a push is a dead end. It arrives, it buzzes, and tapping it
 * drops the person on whatever screen they were last on, leaving them to find
 * the signature request themselves -- which is most of the value of having
 * been told about it.
 *
 * The destination is built from the data the backend attaches rather than
 * parsed out of the wording, so rephrasing a title cannot break navigation,
 * and it goes through the same resolver the in-app list uses so the two cannot
 * disagree about where a task lives.
 */
export function usePushTapNavigation(signedIn: boolean) {
  useEffect(() => {
    if (!signedIn) {
      return;
    }

    let cancelled = false;

    const open = (data: unknown) => {
      // The payload crosses a process boundary and is whatever the sender put
      // there, so it is checked rather than asserted. A malformed one is
      // ignored: landing nowhere is better than navigating somewhere wrong.
      if (typeof data !== "object" || data === null) {
        return;
      }

      const { entity_type, entity_id, workspace_id } = data as Record<
        string,
        unknown
      >;

      if (typeof entity_type !== "string" || typeof entity_id !== "string") {
        return;
      }

      const route = resolveEntityRoute({
        entity_type,
        entity_id,
        workspace_id: typeof workspace_id === "string" ? workspace_id : undefined,
      });

      if (route) {
        router.push(route);
      }
    };

    /*
     * A tap that launched the app from cold arrives before any listener can be
     * attached, so it is asked for separately. Handling only the live event
     * would mean notifications work when the app is already running and do
     * nothing when it is not -- which is the more common case, and the one
     * that matters most.
     */
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (cancelled || !response) {
        return;
      }

      open(response.notification.request.content.data);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        open(response.notification.request.content.data);
      },
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [signedIn]);
}
