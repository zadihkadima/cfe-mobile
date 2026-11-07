/**
 * Global test setup.
 *
 * The mocks below stand in for native modules that have no JavaScript
 * implementation outside a device or simulator. They are deliberately faithful
 * to the real contracts rather than convenient stubs, because a mock that is
 * more permissive than the module it replaces lets broken code pass.
 */

// The config module refuses to load without an API base URL, by design: a build
// that silently pointed at nothing would fail at the first request instead of
// at startup. Tests supply one so that importing anything which reaches the
// network layer does not fail for want of configuration. The value is
// deliberately unroutable, so a test that accidentally performs a real request
// fails rather than reaching a live service.
process.env.EXPO_PUBLIC_API_URL = "http://127.0.0.1:9/api/v1";

// react-native-mmkv v4 is backed by Nitro and cannot instantiate under Node.
// This in-memory double implements the same surface the storage module uses,
// including the synchronous semantics the rest of the app depends on.
jest.mock("react-native-mmkv", () => {
  class MemoryMMKV {
    constructor(config) {
      this.config = config;
      this.store = new Map();
    }

    set(key, value) {
      this.store.set(key, value);
    }

    getString(key) {
      const value = this.store.get(key);
      return typeof value === "string" ? value : undefined;
    }

    getBoolean(key) {
      const value = this.store.get(key);
      return typeof value === "boolean" ? value : undefined;
    }

    getNumber(key) {
      const value = this.store.get(key);
      return typeof value === "number" ? value : undefined;
    }

    contains(key) {
      return this.store.has(key);
    }

    // The real Nitro API is `remove`, not `delete`. Naming it otherwise would
    // make a typo in application code pass here and fail on a device.
    remove(key) {
      return this.store.delete(key);
    }

    getAllKeys() {
      return Array.from(this.store.keys());
    }

    clearAll() {
      this.store.clear();
    }
  }

  // Configurations are recorded on a global rather than a jest.fn, because the
  // storage module opens its instances once at import time while `clearMocks`
  // wipes call history between tests. A jest.fn would report zero calls to
  // every test after the first.
  global.__mmkvConfigs = [];

  return {
    MMKV: MemoryMMKV,
    createMMKV: (config) => {
      global.__mmkvConfigs.push(config);
      return new MemoryMMKV(config);
    },
  };
});

// The keystore is hardware-backed on device. Returning a stable fake key keeps
// the encrypted-storage code path under test rather than silently bypassed.
jest.mock("expo-secure-store", () => ({
  getItem: jest.fn(() => "0123456789abcdef0123456789abcdef"),
  setItem: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
}));

jest.mock("expo-crypto", () => ({
  getRandomBytes: jest.fn((length) => new Uint8Array(length).fill(7)),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/",
  useLocalSearchParams: () => ({}),
}));

// The system clipboard has no Node implementation. The double keeps the real
// contract -- an async write that resolves -- because the component treats a
// rejection as "do not confirm", and a mock that could never reject would
// leave that branch untested.
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
  getStringAsync: jest.fn(() => Promise.resolve("")),
}));
