import { apiClient } from "../api-client";
import type { ApiResponse, Appointment, BookAppointmentPayload, PaginatedResponse } from "@/types/api";

export const appointmentsApi = {
  create: async (payload: BookAppointmentPayload) => {
    const response = await apiClient.post<ApiResponse<Appointment>>("/appointments", payload);
    return response.data.data;
  },
  list: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get<PaginatedResponse<Appointment>>("/appointments", { params });
    return response.data;
  },
};


