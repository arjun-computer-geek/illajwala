import type {
  ApiResponse,
  Appointment,
  AppointmentPaymentStatus,
  AppointmentStatus,
  PaginatedResponse,
} from "@illajwala/types";
import { adminApiClient } from "../api-client";

export type UpdateAppointmentStatusPayload = {
  status: AppointmentStatus;
  notes?: string;
};

export type UpdateAppointmentPaymentPayload = {
  status: AppointmentPaymentStatus;
  paymentId?: string;
  notes?: string;
};

export const appointmentsApi = {
  async list(params?: { page?: number; pageSize?: number; status?: AppointmentStatus }) {
    const response = await adminApiClient.get<PaginatedResponse<Appointment>>("/appointments", {
      params,
    });
    return response.data;
  },

  async updateStatus(id: string, payload: UpdateAppointmentStatusPayload) {
    const response = await adminApiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, payload);
    return response.data.data;
  },

  async updatePayment(id: string, payload: UpdateAppointmentPaymentPayload) {
    const response = await adminApiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/payment`, payload);
    return response.data.data;
  },
};


