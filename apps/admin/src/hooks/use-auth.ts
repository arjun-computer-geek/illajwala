"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { AdminAuthResponse, AdminProfile, TokenRefreshResponse } from "@illajwala/types";
import {
  setAdminAuthToken,
  subscribeAdminRefresh,
  subscribeAdminUnauthorized,
} from "../lib/api-client";
import { adminAuthApi } from "../lib/api/auth";

type AdminAuthState = {
  token: string | null;
  admin: AdminProfile | null;
  hydrated: boolean;
  setAuth: (payload: AdminAuthResponse) => void;
  clearAuth: (options?: { skipRemote?: boolean }) => void;
  setHydrated: () => void;
};

const storageKey = "illajwala-admin-auth";

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      hydrated: false,
      setAuth: ({ token, admin }) => {
        set({ token, admin });
        setAdminAuthToken(token, { silent: true });
      },
      clearAuth: (options) => {
        set({ token: null, admin: null });
        setAdminAuthToken(null, { silent: true });
        if (!options?.skipRemote) {
          void adminAuthApi.logout().catch((error) => {
            console.warn("[admin-auth] Failed to logout remotely", error);
          });
        }
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: storageKey,
      partialize: ({ token, admin }) => ({ token, admin }),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          setAdminAuthToken(state.token ?? null, { silent: true });
        }
        state?.setHydrated?.();
      },
    }
  )
);

const handleAdminRefresh = (payload: TokenRefreshResponse) => {
  if (payload.role !== "admin") {
    return;
  }

  setAdminAuthToken(payload.token, { silent: true });
  useAdminAuthStore.setState({
    token: payload.token,
    admin: payload.admin,
  });
};

subscribeAdminRefresh(handleAdminRefresh);
subscribeAdminUnauthorized(() => {
  useAdminAuthStore.getState().clearAuth({ skipRemote: true });
});

export const useAdminAuth = () =>
  useAdminAuthStore(
    useShallow((state) => ({
      token: state.token,
      admin: state.admin,
      hydrated: state.hydrated,
      isAuthenticated: Boolean(state.token),
      setAuth: state.setAuth,
      clearAuth: state.clearAuth,
    }))
  );

