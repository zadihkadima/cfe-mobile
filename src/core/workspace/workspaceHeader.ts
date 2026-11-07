import { storage } from "../storage/mmkv";

import { queryClient } from "@/core/query/queryClient";
import { setWorkspace } from "@/core/store/workspaceSlice";
import { store } from "@/core/store";

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


export const switchWorkspace = (id: string) => {
  store.dispatch(setWorkspace(id));

  queryClient.clear();
};