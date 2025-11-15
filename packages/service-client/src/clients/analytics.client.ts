import { ServiceClient, type ServiceClientOptions } from '../client';
import { serviceConfig } from '../config';

export interface OpsMetricsSummary {
  totalAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalWaitlistEntries: number;
  activeWaitlistEntries: number;
  promotedWaitlistEntries: number;
  expiredWaitlistEntries: number;
}

export interface OpsMetricsSeries {
  date: string;
  appointments: number;
  waitlistEntries: number;
  promotions: number;
}

export interface SLAMetrics {
  averageResponseTime: number;
  averageWaitTime: number;
  averageConsultationDuration: number;
  onTimeAppointments: number;
  delayedAppointments: number;
  noShowRate: number;
}

export interface ClinicMetrics {
  clinicId: string;
  clinicName: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalWaitlistEntries: number;
  activeWaitlistEntries: number;
  averageWaitTime: number;
  noShowRate: number;
}

export interface AnalyticsServiceClient {
  getOpsPulse(tenantId: string): Promise<OpsMetricsSummary>;
  getOpsSeries(tenantId: string, days?: number): Promise<OpsMetricsSeries[]>;
  getSLAMetrics(tenantId: string, startDate?: string, endDate?: string): Promise<SLAMetrics>;
  getClinicMetrics(tenantId: string, clinicId?: string): Promise<ClinicMetrics | ClinicMetrics[]>;
  getOverviewStats(tenantId: string): Promise<{
    totalPatients: number;
    totalDoctors: number;
    totalClinics: number;
    totalAppointments: number;
  }>;
}

export class AnalyticsServiceClientImpl implements AnalyticsServiceClient {
  private client: ServiceClient;

  constructor(options?: Partial<ServiceClientOptions>) {
    this.client = new ServiceClient(
      {
        baseURL: serviceConfig.analyticsServiceUrl,
        ...options,
      },
      serviceConfig,
    );
  }

  async getOpsPulse(tenantId: string): Promise<OpsMetricsSummary> {
    const response = await this.client.get<{ data: OpsMetricsSummary; message?: string }>(
      `/api/analytics/ops/pulse?tenantId=${tenantId}`,
    );
    return response.data;
  }

  async getOpsSeries(tenantId: string, days: number = 14): Promise<OpsMetricsSeries[]> {
    const response = await this.client.get<{ data: OpsMetricsSeries[]; message?: string }>(
      `/api/analytics/ops/series?tenantId=${tenantId}&days=${days}`,
    );
    return response.data;
  }

  async getSLAMetrics(tenantId: string, startDate?: string, endDate?: string): Promise<SLAMetrics> {
    const queryParams = new URLSearchParams();
    queryParams.append('tenantId', tenantId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const response = await this.client.get<{ data: SLAMetrics; message?: string }>(
      `/api/analytics/sla?${queryParams.toString()}`,
    );
    return response.data;
  }

  async getClinicMetrics(
    tenantId: string,
    clinicId?: string,
  ): Promise<ClinicMetrics | ClinicMetrics[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('tenantId', tenantId);
    if (clinicId) queryParams.append('clinicId', clinicId);

    const response = await this.client.get<{
      data: ClinicMetrics | ClinicMetrics[];
      message?: string;
    }>(`/api/analytics/clinics/metrics?${queryParams.toString()}`);
    return response.data;
  }

  async getOverviewStats(tenantId: string): Promise<{
    totalPatients: number;
    totalDoctors: number;
    totalClinics: number;
    totalAppointments: number;
  }> {
    const response = await this.client.get<{
      data: {
        totalPatients: number;
        totalDoctors: number;
        totalClinics: number;
        totalAppointments: number;
      };
      message?: string;
    }>(`/api/stats/overview?tenantId=${tenantId}`);
    return response.data;
  }
}

export function createAnalyticsServiceClient(
  options?: Partial<ServiceClientOptions>,
): AnalyticsServiceClient {
  return new AnalyticsServiceClientImpl(options);
}
