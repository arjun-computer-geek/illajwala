"use client";

import { createApiClient } from "@illajwala/api-client";
import { doctorAppConfig } from "./config";

let authToken: string | null = null;
let tenantId: string | null = null;

export const doctorApiClient = createApiClient({
  baseURL: doctorAppConfig.apiBaseUrl,
  getAuthToken: () => authToken,
  getTenantId: () => tenantId,
  onUnauthorized: () => {
    console.warn("[doctor-api] Unauthorized response received, clearing session token");
    authToken = null;
  },
});

export const setDoctorAuthToken = (token: string | null) => {
  authToken = token;
};

export const setDoctorTenant = (clinicId: string | null) => {
  tenantId = clinicId;
};

