// Service endpoints
const identityServiceUrl =
  process.env.NEXT_PUBLIC_IDENTITY_SERVICE_URL ?? 'http://localhost:4000/api';
const providerServiceUrl =
  process.env.NEXT_PUBLIC_PROVIDER_SERVICE_URL ?? 'http://localhost:4001/api';
const appointmentServiceUrl =
  process.env.NEXT_PUBLIC_APPOINTMENT_SERVICE_URL ?? 'http://localhost:4002/api';
const paymentServiceUrl =
  process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL ?? 'http://localhost:4003/api';
const analyticsServiceUrl =
  process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL ?? 'http://localhost:4004/api';
const storageServiceUrl =
  process.env.NEXT_PUBLIC_STORAGE_SERVICE_URL ?? 'http://localhost:4005/api';

// Legacy support - use identity service as default
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? identityServiceUrl;
const realtimeBaseUrl =
  process.env.NEXT_PUBLIC_REALTIME_BASE_URL ??
  `${appointmentServiceUrl.replace(/\/$/, '')}/realtime`;
const defaultTenantId = process.env.NEXT_PUBLIC_TENANT_ID ?? 'demo-clinic';

export const appConfig = {
  apiBaseUrl, // Default/legacy - points to identity service
  identityServiceUrl,
  providerServiceUrl,
  appointmentServiceUrl,
  paymentServiceUrl,
  analyticsServiceUrl,
  storageServiceUrl,
  realtimeBaseUrl,
  defaultTenantId,
};
