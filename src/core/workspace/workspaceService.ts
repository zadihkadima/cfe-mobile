import { storage } from "../storage/mmkv";

const KEY = "active_workspace_id";

export const workspaceService = {
  set(id: string) {
    storage.setString(KEY, id);
  },

  get() {
    return storage.getString(KEY);
  },

  clear() {
    storage.delete(KEY);
  },
};