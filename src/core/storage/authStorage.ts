import { storage } from "./mmkv";

const USER_KEY = "user";

export const authStorage = {
  setUser(user: unknown) {
    storage.setJSON(USER_KEY, user);
  },

  getUser<T>() {
    return storage.getJSON<T>(USER_KEY);
  },

  clearUser() {
    storage.delete(USER_KEY);
  },
};