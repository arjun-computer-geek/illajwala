import type { ApiResponse, Doctor, DoctorReviewStatus } from "@illajwala/types";
import { adminApiClient } from "../api-client";

export type ReviewDoctorPayload = {
  status: DoctorReviewStatus;
  note?: string;
  author?: string;
  onboardingChecklist?: Partial<Doctor["onboardingChecklist"]>;
};

export type AddDoctorNotePayload = {
  message: string;
  author?: string;
  status?: DoctorReviewStatus;
};

export const providersApi = {
  async listProviders() {
    const response = await adminApiClient.get<ApiResponse<Doctor[]>>("/doctors", {
      params: { pageSize: 20 },
    });
    return response.data.data;
  },

  async reviewDoctor(id: string, payload: ReviewDoctorPayload) {
    const response = await adminApiClient.post<ApiResponse<Doctor>>(`/doctors/${id}/review`, payload);
    return response.data.data;
  },

  async addReviewNote(id: string, payload: AddDoctorNotePayload) {
    const response = await adminApiClient.post<ApiResponse<Doctor>>(`/doctors/${id}/notes`, payload);
    return response.data.data;
  },
};

