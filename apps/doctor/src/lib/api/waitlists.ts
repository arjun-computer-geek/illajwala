'use client';

import type { ApiResponse, PaginatedResponse, WaitlistEntry } from '@illajwala/types';
import { doctorApiClient } from '../api-client';

type ListWaitlistsParams = {
  status?: string;
  clinicId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'priority' | 'createdAt';
};

export const doctorWaitlistsApi = {
  async list(params: ListWaitlistsParams = {}): Promise<PaginatedResponse<WaitlistEntry>> {
    const response = await doctorApiClient.get<PaginatedResponse<WaitlistEntry>>('/waitlists', {
      params,
    });
    return response.data;
  },
  async updateStatus(id: string, status: WaitlistEntry['status'], notes?: string) {
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
  async updatePriority(id: string, priorityScore: number, notes?: string) {
    await doctorApiClient.patch<ApiResponse<WaitlistEntry>>(`/waitlists/${id}/priority`, {
      priorityScore,
      ...(notes ? { notes } : {}),
    });
  },
  async bulkUpdateStatus(entryIds: string[], status: WaitlistEntry['status'], notes?: string) {
    const response = await doctorApiClient.post<ApiResponse<{ matched: number; modified: number }>>(
      '/waitlists/bulk/status',
      {
        entryIds,
        status,
        ...(notes ? { notes } : {}),
      },
    );
    return response.data;
  },
  async getPolicy(clinicId?: string) {
    const response = await doctorApiClient.get<ApiResponse<any>>('/waitlists/policy', {
      params: clinicId ? { clinicId } : {},
    });
    return response.data;
  },
  async updatePolicy(policy: {
    clinicId?: string;
    maxQueueSize?: number;
    autoExpiryHours?: number;
    autoPromoteBufferMinutes?: number;
    priorityWeights?: Record<string, number>;
  }) {
    const response = await doctorApiClient.put<ApiResponse<any>>('/waitlists/policy', policy);
    return response.data;
  },
  async getAnalytics(params?: { startDate?: string; endDate?: string; clinicId?: string }) {
    const response = await doctorApiClient.get<ApiResponse<any>>('/waitlists/analytics', {
      params,
    });
    return response.data;
  },
};
