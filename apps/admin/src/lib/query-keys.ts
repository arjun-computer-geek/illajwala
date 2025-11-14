export const adminQueryKeys = {
  opsMetrics: () => ["admin", "ops", "metrics"] as const,
  opsAnalytics: () => ["admin", "ops", "analytics"] as const,
  notificationAudit: () => ["admin", "notifications", "audit"] as const,
  waitlistEntries: (clinicId: string | null) => ["admin", "waitlists", "entries", clinicId ?? "all"] as const,
  waitlistPolicy: (clinicId: string | null) => ["admin", "waitlists", "policy", clinicId ?? "all"] as const,
  clinics: (filters?: Record<string, unknown>) => ["admin", "clinics", filters] as const,
  clinic: (id: string) => ["admin", "clinics", id] as const,
};


