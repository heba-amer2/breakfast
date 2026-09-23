import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthRole = "ADMIN" | "USER";

export type AuthUser = {
  token: string;
  userId: number;
  name: string;
  phone: string;
  role: AuthRole;
};

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.token = action.payload?.token ?? null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("breakfast_token");
        window.localStorage.removeItem("breakfast_user");
      }
    },
  },
});

export const { setAuthUser, setLoading, setAuthError, clearAuthError, logout } =
  authSlice.actions;

export default authSlice.reducer;
