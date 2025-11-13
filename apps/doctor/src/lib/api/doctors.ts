import type { ApiResponse, Doctor } from "@illajwala/types";
import { doctorApiClient } from "../api-client";

export type UpdateDoctorProfilePayload = {
  name?: string;
  about?: string;
  languages?: string[];
  consultationModes?: Doctor["consultationModes"];
  fee?: number;
  experienceYears?: number;
  clinicLocations?: Doctor["clinicLocations"];
  profileImageUrl?: string;
  onboardingChecklist?: Partial<Doctor["onboardingChecklist"]>;
};

export const doctorProfileApi = {
  async updateProfile(payload: UpdateDoctorProfilePayload) {
    const response = await doctorApiClient.patch<ApiResponse<Doctor>>("/doctors/me/profile", payload);
    return response.data.data;
  },
};


