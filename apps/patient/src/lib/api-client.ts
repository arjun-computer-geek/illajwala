import { createApiClient } from "@illajwala/api-client";
import {
  tokenRefreshResponseSchema,
  type ApiResponse,
  type TokenRefreshResponse,
} from "@illajwala/types";
import { appConfig } from "./config";

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

export const subscribeAuthToken = (listener: TokenListener) => {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
};

export const subscribeAuthRefresh = (listener: RefreshListener) => {
  refreshListeners.add(listener);
  return () => refreshListeners.delete(listener);
};

export const subscribeUnauthorized = (listener: UnauthorizedListener) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

type SetAuthTokenOptions = {
  silent?: boolean;
};

export const setAuthToken = (token: string | null, options?: SetAuthTokenOptions) => {
  authToken = token;
  if (!options?.silent) {
    notifyTokenListeners(token);
  }
};

export const setTenantContext = (id: string | null) => {
  tenantId = id;
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await apiClient.post<ApiResponse<TokenRefreshResponse>>(
      "/auth/refresh",
      {},
      { skipAuthRefresh: true } as any
    );
    const result = tokenRefreshResponseSchema.parse(response.data.data);

    setAuthToken(result.token);
    notifyRefreshListeners(result);

    return result.token;
  } catch (error) {
    console.warn("[api] Refresh token request failed:", error);
    setAuthToken(null);
    notifyUnauthorizedListeners();
    return null;
  }
};

export const apiClient = createApiClient({
  baseURL: appConfig.apiBaseUrl,
  getAuthToken: () => authToken,
  getTenantId: () => tenantId,
  refreshAccessToken,
  onUnauthorized: () => {
    console.warn("[api] Request unauthorized – clearing auth session");
    setAuthToken(null);
    notifyUnauthorizedListeners();
  },
});

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
