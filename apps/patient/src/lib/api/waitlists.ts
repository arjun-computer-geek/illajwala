"use client";

import { apiClient } from "../api-client";
import type { ApiResponse, PaginatedResponse, WaitlistEntry } from "@illajwala/types";

type CreateWaitlistEntryInput = {
  patientId: string;
  doctorId?: string;
  clinicId?: string;
  requestedWindow?: {
    start?: string;
    end?: string;
    notes?: string;
  };
  notes?: string;
  metadata?: Record<string, unknown>;
};

export const patientWaitlistsApi = {
  async list(params?: { status?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<WaitlistEntry>> {
    const response = await apiClient.get<PaginatedResponse<WaitlistEntry>>("/waitlists", {
      params,
    });
    return response.data;
  },

  async get(id: string): Promise<WaitlistEntry> {
    const response = await apiClient.get<ApiResponse<WaitlistEntry>>(`/waitlists/${id}`);
    return response.data.data;
  },

  async create(input: CreateWaitlistEntryInput): Promise<WaitlistEntry> {
    const response = await apiClient.post<ApiResponse<WaitlistEntry>>("/waitlists", input);
    return response.data.data;
  },

  async cancel(id: string, notes?: string): Promise<WaitlistEntry> {
    const response = await apiClient.patch<ApiResponse<WaitlistEntry>>(`/waitlists/${id}/status`, {
      status: "cancelled",
      notes,
    });
    return response.data.data;
  },
};

