const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const realtimeBaseUrl =
  process.env.NEXT_PUBLIC_REALTIME_BASE_URL ?? `${apiBaseUrl.replace(/\/$/, "")}/realtime`;
const defaultTenantId = process.env.NEXT_PUBLIC_TENANT_ID ?? "demo-clinic";

export const appConfig = {
  apiBaseUrl,
  realtimeBaseUrl,
  defaultTenantId,
};

