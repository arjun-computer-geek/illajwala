import { apiClient } from "../api-client";
import type {
  ApiResponse,
  NotificationHistoryEntry,
  NotificationPreferences,
  PatientProfile,
} from "@/types/api";

export const patientsApi = {
  me: async () => {
    const response = await apiClient.get<ApiResponse<PatientProfile>>("/patients/me");
    return response.data.data;
  },
  getNotificationPreferences: async () => {
    const response = await apiClient.get<ApiResponse<NotificationPreferences>>("/patients/me/preferences");
    return response.data.data;
  },
  updateNotificationPreferences: async (payload: Partial<NotificationPreferences>) => {
    const response = await apiClient.patch<ApiResponse<NotificationPreferences>>("/patients/me/preferences", payload);
    return response.data.data;
  },
  getNotificationHistory: async () => {
    const response = await apiClient.get<ApiResponse<NotificationHistoryEntry[]>>(
      "/notifications/history/me"
    );
    return response.data.data;
  },
};


