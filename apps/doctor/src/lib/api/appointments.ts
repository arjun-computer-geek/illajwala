"use client";

import type { ApiResponse, Appointment, AppointmentStatus, PaginatedResponse } from "@illajwala/types";
import { doctorApiClient } from "../api-client";

type ListAppointmentsParams = {
  page?: number;
  pageSize?: number;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
};

export type UpdateConsultationPayload = {
  status: AppointmentStatus;
  notes?: string;
  consultation?: {
    notes?: string;
    followUpActions?: string[];
  };
};

/**
 * Doctor-facing wrapper around appointment routes.
 * We keep the API intentionally tiny while the consultation workspace evolves.
 */
export const doctorAppointmentsApi = {
  async list(params: ListAppointmentsParams = {}): Promise<PaginatedResponse<Appointment>> {
    // Back-end already scopes results to the authenticated doctor, so we only
    // need to pass through optional filters (status/date range) from the UI.
    const response = await doctorApiClient.get<PaginatedResponse<Appointment>>("/appointments", {
      params,
    });
    return response.data;
  },
  async updateStatus(id: string, payload: UpdateConsultationPayload): Promise<Appointment> {
    const response = await doctorApiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, payload);
    return response.data.data;
  },
};


