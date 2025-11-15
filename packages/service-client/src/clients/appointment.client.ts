import { ServiceClient, type ServiceClientOptions } from '../client';
import { serviceConfig } from '../config';
import type {
  Appointment,
  BookAppointmentPayload,
  BookAppointmentResponse,
  ConfirmAppointmentPaymentInput,
  AppointmentStatus,
} from '@illajwala/types';

export interface AppointmentServiceClient {
  createAppointment(data: BookAppointmentPayload): Promise<BookAppointmentResponse>;
  getAppointment(id: string): Promise<Appointment>;
  listAppointments(params?: {
    status?: AppointmentStatus;
    startDate?: string;
    endDate?: string;
    patientId?: string;
    doctorId?: string;
    clinicId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ appointments: Appointment[]; total: number; page: number; totalPages: number }>;
  updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    notes?: string,
  ): Promise<Appointment>;
  confirmPayment(appointmentId: string, data: ConfirmAppointmentPaymentInput): Promise<Appointment>;
  cancelAppointment(id: string, reason?: string): Promise<Appointment>;
}

export class AppointmentServiceClientImpl implements AppointmentServiceClient {
  private client: ServiceClient;

  constructor(options?: Partial<ServiceClientOptions>) {
    this.client = new ServiceClient(
      {
        baseURL: serviceConfig.appointmentServiceUrl,
        ...options,
      },
      serviceConfig,
    );
  }

  async createAppointment(data: BookAppointmentPayload): Promise<BookAppointmentResponse> {
    const response = await this.client.post<{ data: BookAppointmentResponse; message?: string }>(
      '/api/appointments',
      data,
    );
    return response.data;
  }

  async getAppointment(id: string): Promise<Appointment> {
    const response = await this.client.get<{ data: Appointment; message?: string }>(
      `/api/appointments/${id}`,
    );
    return response.data;
  }

  async listAppointments(params?: {
    status?: AppointmentStatus;
    startDate?: string;
    endDate?: string;
    patientId?: string;
    doctorId?: string;
    clinicId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ appointments: Appointment[]; total: number; page: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.patientId) queryParams.append('patientId', params.patientId);
    if (params?.doctorId) queryParams.append('doctorId', params.doctorId);
    if (params?.clinicId) queryParams.append('clinicId', params.clinicId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.client.get<{
      data: Appointment[];
      meta: { total: number; page: number; pageSize: number; totalPages: number };
    }>(url);
    return {
      appointments: response.data,
      total: response.meta.total,
      page: response.meta.page,
      totalPages: response.meta.totalPages,
    };
  }

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    notes?: string,
  ): Promise<Appointment> {
    const response = await this.client.patch<{ data: Appointment; message?: string }>(
      `/api/appointments/${id}/status`,
      { status, notes },
    );
    return response.data;
  }

  async confirmPayment(
    appointmentId: string,
    data: ConfirmAppointmentPaymentInput,
  ): Promise<Appointment> {
    const response = await this.client.post<{ data: Appointment; message?: string }>(
      `/api/appointments/${appointmentId}/payment/confirm`,
      data,
    );
    return response.data;
  }

  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const response = await this.client.patch<{ data: Appointment; message?: string }>(
      `/api/appointments/${id}/cancel`,
      { reason },
    );
    return response.data;
  }
}

export function createAppointmentServiceClient(
  options?: Partial<ServiceClientOptions>,
): AppointmentServiceClient {
  return new AppointmentServiceClientImpl(options);
}
