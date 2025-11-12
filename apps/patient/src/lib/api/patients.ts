import { apiClient } from "../api-client";
import type { ApiResponse, PatientProfile } from "@/types/api";

export const patientsApi = {
  me: async () => {
    const response = await apiClient.get<ApiResponse<PatientProfile>>("/patients/me");
    return response.data.data;
  },
};


