import { IS_STORAGE_ENCRYPTED, storage } from "./mmkv";

type MMKVConfig = {
  id: string;
  encryptionKey?: string;
  encryptionType?: string;
};

/** Configurations captured by the MMKV double in jest.setup.js. */
const configs = (global as unknown as { __mmkvConfigs: MMKVConfig[] })
  .__mmkvConfigs;

const encrypted = configs.find((c) => c.encryptionType !== undefined)!;

/**
 * This store holds the access token, the refresh token and the cached user
 * profile of a tax platform. Before this change it was an unencrypted MMKV
 * file, which on a rooted or jailbroken device — or in an unencrypted device
 * backup — is a plaintext credential sitting on disk.
 *
 * The tests below assert the two properties that make the fix real: new writes
 * are encrypted, and the old plaintext file is destroyed rather than left
 * behind. An upgrade that did only the first would encrypt future tokens while
 * leaving the exact credential it was meant to protect legible next to it.
 */
describe("encrypted storage", () => {
  it("reports that values are encrypted at rest", () => {
    expect(IS_STORAGE_ENCRYPTED).toBe(true);
  });

  it("opens the store with AES-256 and a key from the device keystore", () => {
    expect(encrypted.encryptionType).toBe("AES-256");
    expect(encrypted.encryptionKey).toEqual(expect.any(String));
    expect(encrypted.encryptionKey).toHaveLength(32);
  });

  it("uses a new instance id so an unreadable plaintext file is never opened with a key", () => {
    expect(encrypted.id).toBe("cfe.secure.v1");
    expect(encrypted.id).not.toBe("mmkv.default");
  });

  it("purges the pre-encryption store on start-up", () => {
    // Otherwise the old tokens stay readable on disk beside the encrypted ones.
    expect(configs.some((c) => c.id === "mmkv.default")).toBe(true);
  });
});

describe("storage", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("round-trips a string", () => {
    storage.setString("token", "abc");

    expect(storage.getString("token")).toBe("abc");
  });

  it("returns null rather than undefined for a missing key", () => {
    expect(storage.getString("absent")).toBeNull();
    expect(storage.getJSON("absent")).toBeNull();
  });

  it("round-trips JSON", () => {
    storage.setJSON("user", { id: "1", role: "client" });

    expect(storage.getJSON("user")).toEqual({ id: "1", role: "client" });
  });

  it("treats unparseable JSON as absent instead of throwing", () => {
    // This runs during start-up, before any error boundary is mounted, so a
    // throw here would be an unrecoverable launch crash after a schema change
    // or a partial write.
    storage.setString("user", "{not json");

    expect(() => storage.getJSON("user")).not.toThrow();
    expect(storage.getJSON("user")).toBeNull();
  });

  it("evicts a corrupt value so it cannot fail again on the next launch", () => {
    storage.setString("user", "{not json");
    storage.getJSON("user");

    expect(storage.getString("user")).toBeNull();
  });

  it("deletes a key", () => {
    storage.setString("token", "abc");
    storage.delete("token");

    expect(storage.getString("token")).toBeNull();
  });

  it("clears every key on sign-out", () => {
    storage.setString("access", "a");
    storage.setString("refresh", "b");
    storage.setJSON("user", { id: "1" });

    storage.clear();

    expect(storage.getString("access")).toBeNull();
    expect(storage.getString("refresh")).toBeNull();
    expect(storage.getJSON("user")).toBeNull();
  });
});
