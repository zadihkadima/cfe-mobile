import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type NotificationType = "success" | "error" | "info";

export type Notification = {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  durationMs?: number;
};

type NotificationState = {
  current: Notification | null;
};

const initialState: NotificationState = {
  current: null,
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    showNotification(state, action: PayloadAction<Omit<Notification, "id">>) {
      state.current = {
        id: makeId(),
        durationMs: 3500,
        ...action.payload,
      };
    },

    clearNotification(state) {
      state.current = null;
    },
  },
});

export const { showNotification, clearNotification } = notificationSlice.actions;

export const showSuccess = (message: string, title = "Success") =>
  showNotification({ type: "success", title, message });

export const showError = (message: string, title = "Error") =>
  showNotification({ type: "error", title, message });

export const showInfo = (message: string, title = "Info") =>
  showNotification({ type: "info", title, message });

export default notificationSlice.reducer;
