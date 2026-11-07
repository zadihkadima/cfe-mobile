import { api } from "@/core/api/client";

/**
 * The switches for the signed-in person.
 *
 * `available` comes from the server rather than being hard-coded here, so a
 * kind added on the backend appears without shipping a new app -- and so a
 * client and an administrator cannot disagree about what an administrator is
 * offered.
 */
export type PushSettings = {
  kinds: Record<string, boolean>;
  available: string[];
};

export async function getPushSettings() {
  const { data } = await api.get<PushSettings>("/push/settings");

  return data;
}

/**
 * Saves the switches and returns what was actually stored.
 *
 * The response is used rather than assuming the request took effect: the
 * server drops kinds this role is not offered, and a switch that was silently
 * dropped would otherwise stay on until the screen was reopened.
 */
export async function savePushSettings(kinds: Record<string, boolean>) {
  const { data } = await api.put<PushSettings>("/push/settings", { kinds });

  return data;
}

/**
 * Records this installation as somewhere to deliver.
 *
 * Safe to call on every launch: the server matches on the token, so this
 * refreshes the registration rather than creating a second one.
 */
export async function registerPushDevice(token: string, platform: string) {
  await api.post("/push/devices", { token, platform });
}

/**
 * Forgets this installation, which is what signing out does -- otherwise the
 * next person to sign in on this handset would receive the last one's
 * notifications.
 */
export async function forgetPushDevice(token: string) {
  await api.delete(`/push/devices/${encodeURIComponent(token)}`);
}
