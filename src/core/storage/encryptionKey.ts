import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Supplies the key used to encrypt on-device storage.
 *
 * MMKV writes to a plain file in the app's sandbox. The sandbox alone is not a
 * meaningful boundary: on a rooted or jailbroken device, through an unencrypted
 * device backup, or via a forensic extraction of a lost handset, that file is
 * readable. Because it holds the access and refresh tokens, reading it is
 * equivalent to holding the user's session, and the refresh token in particular
 * outlives the access token by a wide margin.
 *
 * The key itself therefore cannot live in the same file, nor be hard-coded in
 * the bundle where anyone who unzips the IPA or APK can read it. It is held in
 * the platform keystore — Keychain on iOS, Keystore on Android — which is
 * hardware-backed on modern devices and is excluded from unencrypted backups.
 *
 * This is the standard arrangement: a fast unencrypted-at-rest store for bulk
 * data, with its encryption key kept in the one place the operating system
 * protects properly.
 */

/** Keychain/Keystore entry holding the MMKV encryption key. */
const KEY_ALIAS = "cfe.storage.encryption-key";

/**
 * 32 bytes, because the store is configured for AES-256. MMKV accepts at most
 * 16 bytes for AES-128 and 32 for AES-256, so this length and the cipher choice
 * have to stay in step.
 */
const KEY_BYTES = 32;

/**
 * Restricting the entry to `WHEN_UNLOCKED_THIS_DEVICE_ONLY` means the key is
 * unavailable while the device is locked, and is never synchronised to iCloud
 * or migrated to a restored device. A session token that silently follows a
 * user's backup onto a new handset is a credential the user has no idea is
 * still live.
 */
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Returns the encryption key, creating and persisting one on first launch.
 *
 * Deliberately synchronous. Storage is read during module initialisation to
 * restore the session, and an asynchronous key would force every caller of
 * `storage` to become async or force the app to render before it knows whether
 * the user is signed in.
 *
 * Returns `undefined` when the keystore is unusable. That is a real state on
 * some Android devices with a corrupted or unprovisioned keystore, and the
 * right response is to continue unencrypted rather than to render the app
 * permanently unusable: an unencrypted session is a smaller harm than an
 * account the user can never reach.
 */
export function getStorageEncryptionKey(): string | undefined {
  if (Platform.OS === "web") {
    return undefined;
  }

  try {
    const existing = SecureStore.getItem(KEY_ALIAS, SECURE_STORE_OPTIONS);

    if (existing) {
      return existing;
    }

    // Hex-encoded, because SecureStore stores strings and raw random bytes are
    // not valid UTF-8. Hex doubles the length, so 32 bytes becomes 64
    // characters; MMKV measures the key in bytes of the string it is given, so
    // this is passed through a slice below.
    const generated = toHex(Crypto.getRandomBytes(KEY_BYTES)).slice(0, KEY_BYTES);

    SecureStore.setItem(KEY_ALIAS, generated, SECURE_STORE_OPTIONS);

    return generated;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "Secure key storage is unavailable; falling back to unencrypted storage.",
        error,
      );
    }

    return undefined;
  }
}

/**
 * Removes the key, rendering the encrypted store permanently unreadable.
 *
 * This is a stronger guarantee than deleting the values: it makes any copy of
 * the storage file already captured in a backup useless as well.
 */
export function destroyStorageEncryptionKey(): void {
  if (Platform.OS === "web") {
    return;
  }

  // `.catch()` rather than try/catch. deleteItemAsync rejects asynchronously,
  // so a synchronous catch block around an unawaited call never runs: the
  // rejection escaped as an unhandled promise rejection instead, which in a
  // release build is silent. The intent recorded below was therefore not being
  // honoured — the failure it describes was not being swallowed deliberately,
  // it was being lost.
  //
  // Nothing useful can be done if the keystore refuses the delete, and throwing
  // here would break sign-out, stranding the user in a session they are
  // actively trying to leave.
  void SecureStore.deleteItemAsync(KEY_ALIAS, SECURE_STORE_OPTIONS).catch(
    () => {},
  );
}
