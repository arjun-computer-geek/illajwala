"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { AdminAuthResponse, AdminProfile } from "@illajwala/types";
import { setAdminAuthToken } from "../lib/api-client";

type AdminAuthState = {
  token: string | null;
  admin: AdminProfile | null;
  hydrated: boolean;
  setAuth: (payload: AdminAuthResponse) => void;
  clearAuth: () => void;
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
        setAdminAuthToken(token);
      },
      clearAuth: () => {
        set({ token: null, admin: null });
        setAdminAuthToken(null);
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: storageKey,
      partialize: ({ token, admin }) => ({ token, admin }),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          setAdminAuthToken(state.token ?? null);
        }
        state?.setHydrated?.();
      },
    }
  )
);

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

