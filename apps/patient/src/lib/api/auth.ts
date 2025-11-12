import { apiClient } from "../api-client";
import { createIdentityApi } from "@illajwala/api-client";
import type { LoginDoctorInput } from "@illajwala/types";
import type { LoginPatientPayload, PatientAuthResponse, RegisterPatientPayload } from "@/types/api";

const identityApi = createIdentityApi(apiClient);

export const authApi = {
  registerPatient: (payload: RegisterPatientPayload) => identityApi.registerPatient(payload),
  loginPatient: (payload: LoginPatientPayload) => identityApi.loginPatient(payload),
  loginDoctor: (payload: LoginDoctorInput) => identityApi.loginDoctor(payload),
};
