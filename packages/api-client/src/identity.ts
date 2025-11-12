import type { AxiosInstance } from "axios";
import {
  doctorAuthResponseSchema,
  loginDoctorSchema,
  loginPatientSchema,
  patientAuthResponseSchema,
  registerPatientSchema,
  loginAdminSchema,
  adminAuthResponseSchema,
  type DoctorAuthResponse,
  type LoginDoctorInput,
  type LoginPatientInput,
  type PatientAuthResponse,
  type RegisterPatientInput,
  type AdminAuthResponse,
  type LoginAdminInput,
  type ApiResponse,
} from "@illajwala/types";

export type IdentityApi = {
  registerPatient: (payload: RegisterPatientInput) => Promise<PatientAuthResponse>;
  loginPatient: (payload: LoginPatientInput) => Promise<PatientAuthResponse>;
  loginDoctor: (payload: LoginDoctorInput) => Promise<DoctorAuthResponse>;
  loginAdmin: (payload: LoginAdminInput) => Promise<AdminAuthResponse>;
};

export const createIdentityApi = (client: AxiosInstance): IdentityApi => ({
  async registerPatient(payload) {
    const body = registerPatientSchema.parse(payload);
    const response = await client.post<ApiResponse<PatientAuthResponse>>(
      "/auth/patient/register",
      body
    );
    return patientAuthResponseSchema.parse(response.data.data);
  },

  async loginPatient(payload) {
    const body = loginPatientSchema.parse(payload);
    const response = await client.post<ApiResponse<PatientAuthResponse>>(
      "/auth/patient/login",
      body
    );
    return patientAuthResponseSchema.parse(response.data.data);
  },

  async loginDoctor(payload) {
    const body = loginDoctorSchema.parse(payload);
    const response = await client.post<ApiResponse<DoctorAuthResponse>>(
      "/auth/doctor/login",
      body
    );
    return doctorAuthResponseSchema.parse(response.data.data);
  },

  async loginAdmin(payload) {
    const body = loginAdminSchema.parse(payload);
    const response = await client.post<ApiResponse<AdminAuthResponse>>(
      "/auth/admin/login",
      body
    );
    return adminAuthResponseSchema.parse(response.data.data);
  },
});

