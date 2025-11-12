import { createApiClient } from "@illajwala/api-client";
import { appConfig } from "./config";

let authToken: string | null = null;
let tenantId: string | null = null;

export const apiClient = createApiClient({
  baseURL: appConfig.apiBaseUrl,
  getAuthToken: () => authToken,
  getTenantId: () => tenantId,
  onUnauthorized: () => {
    console.warn("[api] Request unauthorized – clearing auth token");
    authToken = null;
  },
});

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const setTenantContext = (id: string | null) => {
  tenantId = id;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API error:", error.response.data);
    } else {
      console.error("API error:", error.message);
    }
    return Promise.reject(error);
  }
);

