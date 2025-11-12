import { apiClient } from "../api-client";
import type {
  ApiResponse,
  Doctor,
  DoctorAvailability,
  PaginatedResponse,
} from "@/types/api";

export const doctorsApi = {
  list: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get<PaginatedResponse<Doctor>>("/doctors", { params });
    return response.data;
  },
  getById: async (doctorId: string) => {
    const response = await apiClient.get<ApiResponse<Doctor>>(`/doctors/${doctorId}`);
    return response.data.data;
  },
  listSpecialties: async () => {
    const response = await apiClient.get<ApiResponse<string[]>>("/doctors/specialties");
    return response.data.data;
  },
  getAvailability: async (doctorId: string, params?: Record<string, unknown>) => {
    const response = await apiClient.get<ApiResponse<DoctorAvailability>>(
      `/doctors/${doctorId}/availability`,
      { params }
    );
    return response.data.data;
  },
};

