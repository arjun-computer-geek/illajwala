"use client";

import type { ApiResponse, PaginatedResponse, WaitlistEntry } from "@illajwala/types";
import { doctorApiClient } from "../api-client";

type ListWaitlistsParams = {
  status?: string;
  clinicId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "priority" | "createdAt";
};

export const doctorWaitlistsApi = {
  async list(params: ListWaitlistsParams = {}): Promise<PaginatedResponse<WaitlistEntry>> {
    const response = await doctorApiClient.get<PaginatedResponse<WaitlistEntry>>("/waitlists", {
      params,
    });
    return response.data;
  },
  async updateStatus(id: string, status: WaitlistEntry["status"], notes?: string) {
    await doctorApiClient.patch<ApiResponse<WaitlistEntry>>(`/waitlists/${id}/status`, {
      status,
      ...(notes ? { notes } : {}),
    });
  },
  async promote(id: string, appointmentId: string, notes?: string) {
    await doctorApiClient.post<ApiResponse<WaitlistEntry>>(`/waitlists/${id}/promote`, {
      appointmentId,
      ...(notes ? { notes } : {}),
    });
  },
};


