"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";

import { setAuthUser, type AuthUser } from "@/features/auth/store/authSlice";
import { store } from "@/store";

function AuthHydrator({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const token = window.localStorage.getItem("breakfast_token");
      const rawUser = window.localStorage.getItem("breakfast_user");

      if (token && rawUser) {
        const user = JSON.parse(rawUser) as AuthUser;
        store.dispatch(setAuthUser({ ...user, token }));
      }
    } catch {
      window.localStorage.removeItem("breakfast_token");
      window.localStorage.removeItem("breakfast_user");
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return children;
}

export default function ReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}
