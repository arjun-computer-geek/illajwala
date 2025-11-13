import type { Doctor, ApiResponse } from "@illajwala/types";
import { adminApiClient } from "../api-client";

export const providersApi = {
  async listProviders() {
    const response = await adminApiClient.get<ApiResponse<Doctor[]>>("/doctors", {
      params: { pageSize: 20 },
    });
    return response.data.data;
  },
};

