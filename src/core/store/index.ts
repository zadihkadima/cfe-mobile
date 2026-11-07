import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import workspaceReducer from "./workspaceSlice";
import notificationReducer from "./notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;