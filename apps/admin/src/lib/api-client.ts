'use client';

import { createApiClient } from '@illajwala/api-client';
import {
  tokenRefreshResponseSchema,
  type ApiResponse,
  type TokenRefreshResponse,
} from '@illajwala/types';
import { adminAppConfig } from './config';

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

export const subscribeAdminAuthToken = (listener: TokenListener) => {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
};

export const subscribeAdminRefresh = (listener: RefreshListener) => {
  refreshListeners.add(listener);
  return () => refreshListeners.delete(listener);
};

export const subscribeAdminUnauthorized = (listener: UnauthorizedListener) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

type SetTokenOptions = {
  silent?: boolean;
};

export const setAdminAuthToken = (token: string | null, options?: SetTokenOptions) => {
  authToken = token;
  if (!options?.silent) {
    notifyTokenListeners(token);
  }
};

export const setAdminTenant = (id: string | null) => {
  tenantId = id;
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await adminApiClient.post<ApiResponse<TokenRefreshResponse>>(
      '/auth/refresh',
      {},
      { skipAuthRefresh: true } as any,
    );
    const result = tokenRefreshResponseSchema.parse(response.data.data);

    setAdminAuthToken(result.token);
    setAdminTenant(result.tenantId ?? null);
    notifyRefreshListeners(result);

    return result.token;
  } catch (error) {
    console.warn('[admin-api] Refresh token request failed:', error);
    setAdminAuthToken(null);
    setAdminTenant(null);
    notifyUnauthorizedListeners();
    return null;
  }
};

export const adminApiClient = createApiClient({
  baseURL: adminAppConfig.apiBaseUrl,
  getAuthToken: () => authToken,
  getTenantId: () => tenantId,
  refreshAccessToken,
  onUnauthorized: () => {
    console.warn('[admin-api] Unauthorized response received, clearing auth token');
    setAdminAuthToken(null);
    setAdminTenant(null);
    notifyUnauthorizedListeners();
  },
});

// Export getters for use in service-specific clients
export const getAdminAuthToken = () => authToken;
export const getAdminTenant = () => tenantId;
