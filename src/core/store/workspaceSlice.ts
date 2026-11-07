import { createSlice } from "@reduxjs/toolkit";
import { workspaceService } from "../workspace/workspaceService";

type State = {
  activeWorkspaceId: string | null;
};

const initialState: State = {
  activeWorkspaceId: workspaceService.get() || null,
};

const slice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setWorkspace(state, action) {
      state.activeWorkspaceId = action.payload;

      workspaceService.set(action.payload);
    },

    clearWorkspace(state) {
      state.activeWorkspaceId = null;
      workspaceService.clear();
    },
  },
});

export const {
  setWorkspace,
  clearWorkspace,
} = slice.actions;

export default slice.reducer;