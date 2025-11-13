"use client";

import { createApiClient } from "@illajwala/api-client";
import {
  tokenRefreshResponseSchema,
  type ApiResponse,
  type TokenRefreshResponse,
} from "@illajwala/types";
import { doctorAppConfig } from "./config";

let authToken: string | null = null;
let tenantId: string | null = null;

type TokenListener = (token: string | null) => void;
type RefreshListener = (payload: TokenRefreshResponse) => void;
type UnauthorizedListener = () => void;

const tokenListeners = new Set<TokenListener>();
const refreshListeners = new Set<RefreshListener>();
const unauthorizedListeners = new Set<UnauthorizedListener>();

const notifyTokenListeners = (token: string | null) => {
  tokenListeners.forEach((listener) => listener(token));
};

const notifyRefreshListeners = (payload: TokenRefreshResponse) => {
  refreshListeners.forEach((listener) => listener(payload));
};

const notifyUnauthorizedListeners = () => {
  unauthorizedListeners.forEach((listener) => listener());
};

export const subscribeDoctorAuthToken = (listener: TokenListener) => {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
};

export const subscribeDoctorRefresh = (listener: RefreshListener) => {
  refreshListeners.add(listener);
  return () => refreshListeners.delete(listener);
};

export const subscribeDoctorUnauthorized = (listener: UnauthorizedListener) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

type SetTokenOptions = {
  silent?: boolean;
};

export const setDoctorAuthToken = (token: string | null, options?: SetTokenOptions) => {
  authToken = token;
  if (!options?.silent) {
    notifyTokenListeners(token);
  }
};

export const setDoctorTenant = (clinicId: string | null) => {
  tenantId = clinicId;
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await doctorApiClient.post<ApiResponse<TokenRefreshResponse>>(
      "/auth/refresh",
      {},
      { skipAuthRefresh: true } as any
    );
    const result = tokenRefreshResponseSchema.parse(response.data.data);

    setDoctorAuthToken(result.token);
    setDoctorTenant(result.tenantId ?? null);
    notifyRefreshListeners(result);

    return result.token;
  } catch (error) {
    console.warn("[doctor-api] Refresh token request failed:", error);
    setDoctorAuthToken(null);
    setDoctorTenant(null);
    notifyUnauthorizedListeners();
    return null;
  }
};

export const doctorApiClient = createApiClient({
  baseURL: doctorAppConfig.apiBaseUrl,
  getAuthToken: () => authToken,
  getTenantId: () => tenantId,
  refreshAccessToken,
  onUnauthorized: () => {
    console.warn("[doctor-api] Unauthorized response received, clearing session token");
    setDoctorAuthToken(null);
    setDoctorTenant(null);
    notifyUnauthorizedListeners();
  },
});
