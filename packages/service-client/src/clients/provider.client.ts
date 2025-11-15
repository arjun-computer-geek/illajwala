import { ServiceClient, type ServiceClientOptions } from '../client';
import { serviceConfig } from '../config';
import type { Doctor, DoctorSearchParams, Clinic } from '@illajwala/types';

export interface ProviderServiceClient {
  // Doctors
  listDoctorSpecialties(): Promise<string[]>;
  getDoctor(id: string): Promise<Doctor>;
  listDoctors(params?: DoctorSearchParams): Promise<{
    doctors: Doctor[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getDoctorAvailability(
    id: string,
    params: { days?: number },
  ): Promise<{ availableSlots: string[]; bookedSlots: string[] }>;
  createDoctor(data: Partial<Doctor>): Promise<Doctor>;
  updateDoctor(id: string, data: Partial<Doctor>): Promise<Doctor>;
  updateDoctorProfile(id: string, data: Partial<Doctor>): Promise<Doctor>;
  reviewDoctor(id: string, data: { status: string; note?: string }): Promise<Doctor>;
  addDoctorNote(id: string, data: { message: string; status?: string }): Promise<Doctor>;

  // Clinics
  getClinic(id: string): Promise<Clinic>;
  getClinicBySlug(slug: string): Promise<Clinic>;
  listClinics(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ clinics: Clinic[]; total: number; page: number; totalPages: number }>;
  createClinic(data: Partial<Clinic>): Promise<Clinic>;
  updateClinic(id: string, data: Partial<Clinic>): Promise<Clinic>;
  deleteClinic(id: string): Promise<void>;
}

export class ProviderServiceClientImpl implements ProviderServiceClient {
  private client: ServiceClient;

  constructor(options?: Partial<ServiceClientOptions>) {
    this.client = new ServiceClient(
      {
        baseURL: serviceConfig.providerServiceUrl,
        ...options,
      },
      serviceConfig,
    );
  }

  // Doctors
  async listDoctorSpecialties(): Promise<string[]> {
    const response = await this.client.get<{ data: string[]; message?: string }>(
      '/api/doctors/specialties',
    );
    return response.data;
  }

  async getDoctor(id: string): Promise<Doctor> {
    const response = await this.client.get<{ data: Doctor; message?: string }>(
      `/api/doctors/${id}`,
    );
    return response.data;
  }

  async listDoctors(params?: DoctorSearchParams): Promise<{
    doctors: Doctor[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('search', params.query);
    if (params?.specialization) queryParams.append('specialization', params.specialization);
    if (params?.city) queryParams.append('city', params.city);
    if (params?.consultationMode) queryParams.append('mode', params.consultationMode);
    if (params?.featured !== undefined) queryParams.append('featured', String(params.featured));
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('limit', params.pageSize.toString());

    const url = `/api/doctors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.client.get<{
      data: Doctor[];
      meta: { total: number; page: number; pageSize: number; totalPages: number };
    }>(url);
    return {
      doctors: response.data,
      total: response.meta.total,
      page: response.meta.page,
      totalPages: response.meta.totalPages,
    };
  }

  async getDoctorAvailability(
    id: string,
    params: { days?: number },
  ): Promise<{ availableSlots: string[]; bookedSlots: string[] }> {
    const queryParams = new URLSearchParams();
    if (params.days) {
      queryParams.append('days', params.days.toString());
    }

    const response = await this.client.get<{
      data: { availableSlots: string[]; bookedSlots: string[] };
      message?: string;
    }>(`/api/doctors/${id}/availability?${queryParams.toString()}`);
    return response.data;
  }

  async createDoctor(data: Partial<Doctor>): Promise<Doctor> {
    const response = await this.client.post<{ data: Doctor; message?: string }>(
      '/api/doctors',
      data,
    );
    return response.data;
  }

  async updateDoctor(id: string, data: Partial<Doctor>): Promise<Doctor> {
    const response = await this.client.patch<{ data: Doctor; message?: string }>(
      `/api/doctors/${id}`,
      data,
    );
    return response.data;
  }

  async updateDoctorProfile(id: string, data: Partial<Doctor>): Promise<Doctor> {
    const response = await this.client.patch<{ data: Doctor; message?: string }>(
      `/api/doctors/me/profile`,
      data,
    );
    return response.data;
  }

  async reviewDoctor(id: string, data: { status: string; note?: string }): Promise<Doctor> {
    const response = await this.client.post<{ data: Doctor; message?: string }>(
      `/api/doctors/${id}/review`,
      data,
    );
    return response.data;
  }

  async addDoctorNote(id: string, data: { message: string; status?: string }): Promise<Doctor> {
    const response = await this.client.post<{ data: Doctor; message?: string }>(
      `/api/doctors/${id}/notes`,
      data,
    );
    return response.data;
  }

  // Clinics
  async getClinic(id: string): Promise<Clinic> {
    const response = await this.client.get<{ data: Clinic; message?: string }>(
      `/api/clinics/${id}`,
    );
    return response.data;
  }

  async getClinicBySlug(slug: string): Promise<Clinic> {
    const response = await this.client.get<{ data: Clinic; message?: string }>(
      `/api/clinics/slug/${slug}`,
    );
    return response.data;
  }

  async listClinics(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ clinics: Clinic[]; total: number; page: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/clinics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.client.get<{
      data: Clinic[];
      meta: { total: number; page: number; pageSize: number; totalPages: number };
    }>(url);
    return {
      clinics: response.data,
      total: response.meta.total,
      page: response.meta.page,
      totalPages: response.meta.totalPages,
    };
  }

  async createClinic(data: Partial<Clinic>): Promise<Clinic> {
    const response = await this.client.post<{ data: Clinic; message?: string }>(
      '/api/clinics',
      data,
    );
    return response.data;
  }

  async updateClinic(id: string, data: Partial<Clinic>): Promise<Clinic> {
    const response = await this.client.put<{ data: Clinic; message?: string }>(
      `/api/clinics/${id}`,
      data,
    );
    return response.data;
  }

  async deleteClinic(id: string): Promise<void> {
    await this.client.delete(`/api/clinics/${id}`);
  }
}

export function createProviderServiceClient(
  options?: Partial<ServiceClientOptions>,
): ProviderServiceClient {
  return new ProviderServiceClientImpl(options);
}
