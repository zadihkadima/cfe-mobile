import { createSlice } from "@reduxjs/toolkit";

type User = {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: "admin" | "manager" | "client";
  tax_id?: string;
  social_security_number?: string;
  two_factor_enabled?: boolean;
  is_active?: boolean;
  invited?: boolean;
  created_at?: string;
  updated_at?: string;

  /**
   * A link to this account's picture, absent when it has none.
   *
   * Held here rather than fetched where it is drawn. `/auth/me` already returns
   * it and already populates this record, and the header renders on every
   * route -- so reading it from a query there would put a request behind every
   * navigation to show something the store was handed at sign-in.
   *
   * Kept current because the upload and profile-update hooks both dispatch the
   * refreshed profile, so changing the picture updates the header immediately
   * rather than at the next sign-in.
   */
  avatar_url?: string;
};

type AuthState = {
  user: User | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  user: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },

    setHydrated(state, action) {
      state.hydrated = action.payload;
    },

    logout(state) {
      state.user = null;
    },
  },
});

export const {
  setUser,
  setHydrated,
  logout,
} = authSlice.actions;

export default authSlice.reducer;