"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { Doctor, DoctorAuthResponse, TokenRefreshResponse } from "@illajwala/types";
import {
  setDoctorAuthToken,
  setDoctorTenant,
  subscribeDoctorRefresh,
  subscribeDoctorUnauthorized,
} from "../lib/api-client";
import { doctorAuthApi } from "../lib/api/auth";

type DoctorAuthState = {
  token: string | null;
  doctor: Doctor | null;
  hydrated: boolean;
  setAuth: (payload: DoctorAuthResponse) => void;
  clearAuth: (options?: { skipRemote?: boolean }) => void;
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
        setDoctorAuthToken(token, { silent: true });
        setDoctorTenant(doctor?.clinicLocations?.[0]?.city ?? null);
      },
      clearAuth: (options) => {
        set({ token: null, doctor: null });
        setDoctorAuthToken(null, { silent: true });
        setDoctorTenant(null);
        if (!options?.skipRemote) {
          void doctorAuthApi
            .logout()
            .catch((error) => console.warn("[doctor-auth] Failed to logout remotely", error));
        }
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: storageKey,
      partialize: ({ token, doctor }) => ({ token, doctor }),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          setDoctorAuthToken(state.token ?? null, { silent: true });
          setDoctorTenant(state.doctor?.clinicLocations?.[0]?.city ?? null);
        }
        state?.setHydrated?.();
      },
    }
  )
);

const handleDoctorRefresh = (payload: TokenRefreshResponse) => {
  if (payload.role !== "doctor") {
    return;
  }

  setDoctorAuthToken(payload.token, { silent: true });
  useDoctorAuthStore.setState({
    token: payload.token,
    doctor: payload.doctor,
  });
};

subscribeDoctorRefresh(handleDoctorRefresh);
subscribeDoctorUnauthorized(() => {
  useDoctorAuthStore.getState().clearAuth({ skipRemote: true });
});

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

