"use client";

import type { ApiResponse, Clinic, PaginatedResponse } from "@illajwala/types";
import { adminApiClient } from "../api-client";

type ListClinicsParams = {
  city?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type CreateClinicInput = {
  name: string;
  slug: string;
  timezone?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  capacity?: {
    dailyAppointments?: number | null;
    simultaneousAppointments?: number | null;
    waitlistLimit?: number | null;
  };
  waitlistOverrides?: {
    maxQueueSize?: number | null;
    autoExpiryHours?: number | null;
    autoPromoteBufferMinutes?: number | null;
  };
  metadata?: Record<string, unknown>;
};

type UpdateClinicInput = Partial<CreateClinicInput>;

export const adminClinicsApi = {
  async list(params: ListClinicsParams = {}): Promise<PaginatedResponse<Clinic>> {
    const response = await adminApiClient.get<PaginatedResponse<Clinic>>("/clinics", {
      params,
    });
    return response.data;
  },

  async get(id: string): Promise<Clinic> {
    const response = await adminApiClient.get<ApiResponse<Clinic>>(`/clinics/${id}`);
    return response.data.data;
  },

  async getBySlug(slug: string): Promise<Clinic> {
    const response = await adminApiClient.get<ApiResponse<Clinic>>(`/clinics/slug/${slug}`);
    return response.data.data;
  },

  async create(input: CreateClinicInput): Promise<Clinic> {
    const response = await adminApiClient.post<ApiResponse<Clinic>>("/clinics", input);
    return response.data.data;
  },

  async update(id: string, input: UpdateClinicInput): Promise<Clinic> {
    const response = await adminApiClient.patch<ApiResponse<Clinic>>(`/clinics/${id}`, input);
    return response.data.data;
  },
};

