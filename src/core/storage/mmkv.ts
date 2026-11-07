// src/core/storage/mmkv.ts
import { createMMKV } from "react-native-mmkv";

import { getStorageEncryptionKey } from "./encryptionKey";

/**
 * On-device key-value storage, encrypted at rest.
 *
 * The instance id is versioned rather than reusing the previous default one.
 * MMKV cannot read an existing plaintext file with an encryption key applied,
 * so pointing the encrypted instance at the old file would surface as corrupt
 * data rather than as a clean migration. A new id sidesteps that entirely: the
 * old file is abandoned, and the only user-visible consequence is signing in
 * once more, which is an acceptable price for encrypting the credential that
 * made the session possible in the first place.
 */
const STORAGE_ID = "cfe.secure.v1";

/** The instance used before storage was encrypted; purged on first launch. */
const LEGACY_STORAGE_ID = "mmkv.default";

const encryptionKey = getStorageEncryptionKey();

const mmkv = createMMKV({
  id: STORAGE_ID,
  encryptionKey,
  encryptionType: "AES-256",
});

/**
 * Deletes the pre-encryption store.
 *
 * Without this the old file lingers in the sandbox with the tokens still
 * legible inside it, so the upgrade would encrypt future writes while leaving
 * the exact data it was meant to protect sitting in plaintext beside it.
 */
function purgeLegacyStorage(): void {
  try {
    createMMKV({ id: LEGACY_STORAGE_ID }).clearAll();
  } catch (error) {
    if (__DEV__) {
      console.warn("Could not purge the legacy plaintext store.", error);
    }
  }
}

purgeLegacyStorage();

/** True when values are encrypted at rest; surfaced for diagnostics. */
export const IS_STORAGE_ENCRYPTED = encryptionKey !== undefined;

export const storage = {

  setString(
    key: string,
    value: string,
  ) {
    mmkv.set(key, value);
  },


  getString(
    key: string,
  ): string | null {

    return mmkv.getString(key) ?? null;

  },


  setJSON(
    key: string,
    value: unknown,
  ) {
    mmkv.set(
      key,
      JSON.stringify(value),
    );
  },


  getJSON<T>(
    key: string,
  ): T | null {

    const value =
      mmkv.getString(key);

    if (!value) {
      return null;
    }

    // Stored JSON can be unreadable after a schema change or a partial write.
    // Throwing here would crash during start-up, before any error boundary is
    // mounted, so an unparseable value is treated as absent instead.
    try {
      return JSON.parse(value) as T;
    } catch {
      mmkv.remove(key);

      return null;
    }

  },


  delete(key: string) {
    mmkv.remove(key);
  },


  clear() {
    mmkv.clearAll();
  },

};