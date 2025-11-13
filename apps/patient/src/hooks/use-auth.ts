import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import {
  setAuthToken,
  setTenantContext,
  subscribeAuthRefresh,
  subscribeUnauthorized,
} from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";
import type { Doctor, PatientProfile } from "@/types/api";
import type { TokenRefreshResponse } from "@illajwala/types";

export type UserRole = "patient" | "doctor" | "admin" | null;

type AuthPayload =
  | { token: string; role: "patient"; patient: PatientProfile; tenantId: string }
  | { token: string; role: "doctor"; doctor: Doctor; tenantId: string }
  | { token: string; role: "admin"; tenantId?: string };

type AuthState = {
  token: string | null;
  role: UserRole;
  patient: PatientProfile | null;
  doctor: Doctor | null;
  hydrated: boolean;
  setAuth: (data: AuthPayload) => void;
  clearAuth: (options?: { skipRemote?: boolean }) => void;
  setHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      patient: null,
      doctor: null,
      hydrated: false,
      setAuth: (payload) => {
        const base = { token: payload.token, role: payload.role };
        if (payload.role === "patient") {
          set({ ...base, patient: payload.patient, doctor: null });
        } else if (payload.role === "doctor") {
          set({ ...base, doctor: payload.doctor, patient: null });
        } else {
          set({ ...base, patient: null, doctor: null });
        }
        setAuthToken(payload.token, { silent: true });
        setTenantContext(payload.tenantId ?? null);
      },
      clearAuth: (options) => {
        set({ token: null, role: null, patient: null, doctor: null });
        setAuthToken(null, { silent: true });
        setTenantContext(null);
        if (!options?.skipRemote) {
          void authApi.logout().catch((error) => {
            console.warn("[auth] Failed to logout remotely", error);
          });
        }
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "illajwala-auth",
      partialize: ({ token, role, patient, doctor }) => ({
        token,
        role,
        patient,
        doctor,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          setAuthToken(state?.token ?? null, { silent: true });
          const tenantFromState =
            state?.patient?.tenantId ?? state?.doctor?.tenantId ?? (state?.role === "admin" ? null : null);
          setTenantContext(tenantFromState ?? null);
        }
        state?.setHydrated?.();
      },
    }
  )
);

const applyRefreshPayload = (payload: TokenRefreshResponse) => {
  const nextState: Partial<AuthState> = {
    token: payload.token,
    role: payload.role,
  };

  if (payload.role === "patient") {
    nextState.patient = payload.patient as PatientProfile;
    nextState.doctor = null;
  } else if (payload.role === "doctor") {
    nextState.doctor = payload.doctor as Doctor;
    nextState.patient = null;
  } else {
    nextState.patient = null;
    nextState.doctor = null;
  }

  setAuthToken(payload.token, { silent: true });
  setTenantContext(payload.tenantId ?? null);
  useAuthStore.setState(nextState);
};

subscribeAuthRefresh(applyRefreshPayload);
subscribeUnauthorized(() => {
  useAuthStore.getState().clearAuth({ skipRemote: true });
});

export const useAuth = () =>
  useAuthStore(
    useShallow((state) => ({
      token: state.token,
      role: state.role,
      patient: state.patient,
      doctor: state.doctor,
      hydrated: state.hydrated,
      isAuthenticated: Boolean(state.token),
      setAuth: state.setAuth,
      clearAuth: state.clearAuth,
    }))
  );
