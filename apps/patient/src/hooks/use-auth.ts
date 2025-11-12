import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { setAuthToken } from "@/lib/api-client";
import type { Doctor, PatientProfile } from "@/types/api";

export type UserRole = "patient" | "doctor" | "admin" | null;

type AuthPayload =
  | { token: string; role: "patient"; patient: PatientProfile }
  | { token: string; role: "doctor"; doctor: Doctor }
  | { token: string; role: "admin" };

type AuthState = {
  token: string | null;
  role: UserRole;
  patient: PatientProfile | null;
  doctor: Doctor | null;
  hydrated: boolean;
  setAuth: (data: AuthPayload) => void;
  clearAuth: () => void;
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
        setAuthToken(payload.token);
      },
      clearAuth: () => {
        set({ token: null, role: null, patient: null, doctor: null });
        setAuthToken(null);
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
          setAuthToken(state?.token ?? null);
        }
        state?.setHydrated?.();
      },
    }
  )
);

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
