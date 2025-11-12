import { apiClient } from "../api-client";
import type {
  ApiResponse,
  DoctorAuthResponse,
  LoginPatientPayload,
  PatientAuthResponse,
  RegisterPatientPayload,
} from "@/types/api";

export const authApi = {
  registerPatient: async (payload: RegisterPatientPayload) => {
    const response = await apiClient.post<ApiResponse<PatientAuthResponse>>(
      "/auth/patient/register",
      payload
    );
    return response.data.data;
  },
  loginPatient: async (payload: LoginPatientPayload) => {
    const response = await apiClient.post<ApiResponse<PatientAuthResponse>>(
      "/auth/patient/login",
      payload
    );
    return response.data.data;
  },
  loginDoctor: async (payload: { email: string; phone?: string }) => {
    const response = await apiClient.post<ApiResponse<DoctorAuthResponse>>(
      "/auth/doctor/login",
      payload
    );
    return response.data.data;
  },
};


