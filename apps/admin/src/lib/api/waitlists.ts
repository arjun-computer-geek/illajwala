"use client";

import type { ApiResponse, PaginatedResponse, WaitlistEntry, WaitlistPolicy } from "@illajwala/types";
import { adminApiClient } from "../api-client";

type ListWaitlistsParams = {
  clinicId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "priority" | "createdAt";
};

type UpsertWaitlistPolicyInput = {
  clinicId?: string;
  maxQueueSize?: number;
  autoExpiryHours?: number;
  autoPromoteBufferMinutes?: number;
  priorityWeights?: Record<string, number>;
  notificationTemplateOverrides?: Record<string, string>;
};

export const adminWaitlistsApi = {
  async list(params: ListWaitlistsParams = {}): Promise<PaginatedResponse<WaitlistEntry>> {
    const response = await adminApiClient.get<PaginatedResponse<WaitlistEntry>>("/waitlists", {
      params,
    });
    return response.data;
  },
  async getPolicy(clinicId?: string): Promise<WaitlistPolicy> {
    const response = await adminApiClient.get<ApiResponse<WaitlistPolicy>>("/waitlists/policy", {
      params: clinicId ? { clinicId } : {},
    });
    return response.data.data;
  },
  async upsertPolicy(input: UpsertWaitlistPolicyInput): Promise<WaitlistPolicy> {
    const response = await adminApiClient.put<ApiResponse<WaitlistPolicy>>("/waitlists/policy", input);
    return response.data.data;
  },
};


