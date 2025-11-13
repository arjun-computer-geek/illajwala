import { apiClient } from "../api-client";
import type {
  ApiResponse,
  Appointment,
  AppointmentFeedbackPayload,
  BookAppointmentPayload,
  BookAppointmentResponse,
  PaginatedResponse,
  ConfirmAppointmentPaymentPayload,
} from "@/types/api";

export const appointmentsApi = {
  create: async (payload: BookAppointmentPayload) => {
    const response = await apiClient.post<ApiResponse<BookAppointmentResponse>>("/appointments", payload);
    return response.data.data;
  },
  list: async (params?: Record<string, unknown>) => {
    // Patients currently fetch a single page of appointments; pagination will
    // be extended once historical visits are exposed.
    const response = await apiClient.get<PaginatedResponse<Appointment>>("/appointments", { params });
    return response.data;
  },
  confirmPayment: async (appointmentId: string, payload: ConfirmAppointmentPaymentPayload) => {
    const response = await apiClient.post<ApiResponse<Appointment>>(
      `/appointments/${appointmentId}/payment/confirm`,
      payload
    );
    return response.data.data;
  },
  submitFeedback: async (appointmentId: string, payload: AppointmentFeedbackPayload) => {
    const response = await apiClient.post<ApiResponse<Appointment>>(
      `/appointments/${appointmentId}/feedback`,
      payload
    );
    return response.data.data;
  },
};


