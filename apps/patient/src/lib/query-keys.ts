export const queryKeys = {
  doctors: (params?: Record<string, unknown>) => ["doctors", params] as const,
  doctor: (id: string) => ["doctor", id] as const,
  doctorAvailability: (id: string, params?: Record<string, unknown>) =>
    ["doctor-availability", id, params] as const,
  doctorSpecialties: ["doctor-specialties"] as const,
  appointments: (filters?: Record<string, unknown>) => ["appointments", filters] as const,
  patientProfile: ["patient-profile"] as const,
  statsOverview: ["stats", "overview"] as const,
  notificationPreferences: ["patient-notification-preferences"] as const,
  notificationHistory: ["patient-notification-history"] as const,
};

