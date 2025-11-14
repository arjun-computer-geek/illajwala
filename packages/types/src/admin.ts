import { z } from 'zod';
import { objectIdSchema, tenantIdSchema } from './common';

export const adminSchema = z.object({
  _id: objectIdSchema,
  name: z.string(),
  email: z.string().email(),
  role: z.literal('admin').default('admin'),
  tenantId: tenantIdSchema.optional(),
});

export type AdminProfile = z.infer<typeof adminSchema>;

export type OpsMetricsSummary = {
  activeConsultations: number;
  waitingPatients: number;
  averageWaitTime: number;
  noShowRate: number;
  revenueToday: number;
  clinicsActive: number;
  clinicsPending: number;
  alertsOpen: number;
};

export type AnalyticsPoint = {
  date: string;
  value: number;
};

export type AnalyticsSeries = {
  label: string;
  color?: string;
  points: AnalyticsPoint[];
};

export type OpsAnalyticsSeries = {
  consultations: AnalyticsSeries[];
  revenue: AnalyticsSeries[];
  noShow: AnalyticsSeries[];
};

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export type NotificationAuditEntry = {
  id: string;
  channel: NotificationChannel;
  template: string;
  recipient: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  createdAt: string;
  actor?: string | null;
  reason?: string | null;
  tenantId?: string;
};

export type SLAMetrics = {
  verificationSLA: {
    average: number; // hours
    target: number; // hours
    met: number; // percentage
  };
  incidentResolution: {
    average: number; // hours
    target: number; // hours
    met: number; // percentage
  };
  payoutProcessing: {
    average: number; // hours
    target: number; // hours
    met: number; // percentage
  };
  clinicActivation: {
    average: number; // days
    target: number; // days
    met: number; // percentage
  };
};

export type ClinicMetrics = {
  clinicId: string;
  clinicName: string;
  activeDoctors: number;
  appointmentsToday: number;
  revenueToday: number;
  status: 'active' | 'pending' | 'suspended';
};
