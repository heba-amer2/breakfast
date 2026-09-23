"use client";

import { useEffect, useRef } from "react";

import { logout } from "@/features/auth/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

/**
 * Runs `fetcher` once the user session is ready (hydrated + authenticated).
 * Re-runs when `deps` change.
 */
export function useAuthFetch(
  fetcher: () => void | Promise<void>,
  deps: unknown[] = [],
) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await fetcherRef.current();
      } catch (error) {
        const status = (error as Error & { status?: number })?.status;
        if (status === 401) {
          dispatch(logout());
        }
      }
      void cancelled;
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, token, dispatch, ...deps]);

  return { isAuthenticated: Boolean(user && token), user };
}
