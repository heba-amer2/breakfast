import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiRequest } from "@/features/shared/api/client";
import { setAuthError, setAuthUser, setLoading } from "@/features/auth/store/authSlice";

export type RegisterRequest = {
  name: string;
  phone: string;
  password: string;
};

export type LoginRequest = {
  phone: string;
  password: string;
};

export type AuthApiResponse = {
  token: string;
  userId: number;
  name: string;
  phone: string;
  role: "ADMIN" | "USER";
};

const persistAuth = (authUser: AuthApiResponse) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("breakfast_token", authUser.token);
  window.localStorage.setItem("breakfast_user", JSON.stringify(authUser));
};

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload: RegisterRequest, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setAuthError(null));

      const data = await apiRequest<AuthApiResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const authUser: AuthApiResponse = {
        token: data.token,
        userId: data.userId,
        name: data.name,
        phone: data.phone,
        role: data.role,
      };

      persistAuth(authUser);
      dispatch(setAuthUser(authUser));
      return authUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      dispatch(setAuthError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (payload: LoginRequest, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setAuthError(null));

      const data = await apiRequest<AuthApiResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const authUser: AuthApiResponse = {
        token: data.token,
        userId: data.userId,
        name: data.name,
        phone: data.phone,
        role: data.role,
      };

      persistAuth(authUser);
      dispatch(setAuthUser(authUser));
      return authUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      dispatch(setAuthError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);
