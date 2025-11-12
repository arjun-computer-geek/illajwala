"use client";

import { createApiClient } from "@illajwala/api-client";
import { adminAppConfig } from "./config";

let authToken: string | null = null;

export const adminApiClient = createApiClient({
  baseURL: adminAppConfig.apiBaseUrl,
  getAuthToken: () => authToken,
  onUnauthorized: () => {
    console.warn("[admin-api] Unauthorized response received, clearing auth token");
    authToken = null;
  },
});

export const setAdminAuthToken = (token: string | null) => {
  authToken = token;
};

