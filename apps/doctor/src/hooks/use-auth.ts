"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { Doctor, DoctorAuthResponse } from "@illajwala/types";
import { setDoctorAuthToken, setDoctorTenant } from "../lib/api-client";

type DoctorAuthState = {
  token: string | null;
  doctor: Doctor | null;
  hydrated: boolean;
  setAuth: (payload: DoctorAuthResponse) => void;
  clearAuth: () => void;
  setHydrated: () => void;
};

const storageKey = "illajwala-doctor-auth";

export const useDoctorAuthStore = create<DoctorAuthState>()(
  persist(
    (set) => ({
      token: null,
      doctor: null,
      hydrated: false,
      setAuth: ({ token, doctor }) => {
        set({ token, doctor });
        setDoctorAuthToken(token);
        setDoctorTenant(doctor?.clinicLocations?.[0]?.city ?? null);
      },
      clearAuth: () => {
        set({ token: null, doctor: null });
        setDoctorAuthToken(null);
        setDoctorTenant(null);
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: storageKey,
      partialize: ({ token, doctor }) => ({ token, doctor }),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          setDoctorAuthToken(state.token ?? null);
          setDoctorTenant(state.doctor?.clinicLocations?.[0]?.city ?? null);
        }
        state?.setHydrated?.();
      },
    }
  )
);

export const useDoctorAuth = () =>
  useDoctorAuthStore(
    useShallow((state) => ({
      token: state.token,
      doctor: state.doctor,
      hydrated: state.hydrated,
      isAuthenticated: Boolean(state.token),
      setAuth: state.setAuth,
      clearAuth: state.clearAuth,
    }))
  );

