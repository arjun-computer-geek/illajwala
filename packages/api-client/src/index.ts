import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

export type CreateApiClientOptions = {
  baseURL: string;
  getAuthToken?: () => string | null;
  getTenantId?: () => string | null;
  defaultHeaders?: Record<string, string>;
  onUnauthorized?: (error: AxiosError) => void;
  refreshAccessToken?: () => Promise<string | null>;
};

const applyDefaultHeaders = (
  config: InternalAxiosRequestConfig,
  headers?: Record<string, string>
) => {
  if (!headers) {
    return config;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (!config.headers.hasOwnProperty(key)) {
      config.headers.set?.(key, value);
      (config.headers as Record<string, unknown>)[key] = value;
    }
  }

  return config;
};

export const createApiClient = (options: CreateApiClientOptions): AxiosInstance => {
  const instance = axios.create({
    baseURL: options.baseURL,
    withCredentials: true,
  });

  let refreshPromise: Promise<string | null> | null = null;

  const requestNewAccessToken = () => {
    if (!options.refreshAccessToken) {
      return Promise.resolve(null);
    }

    if (!refreshPromise) {
      refreshPromise = options
        .refreshAccessToken()
        .catch((error) => {
          console.error("[api] Failed to refresh access token", error);
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    return refreshPromise;
  };

  instance.interceptors.request.use((config) => {
    applyDefaultHeaders(config, options.defaultHeaders);

    const token = options.getAuthToken?.();
    if (token) {
      config.headers.set?.("Authorization", `Bearer ${token}`);
    }

    const tenantId = options.getTenantId?.();
    if (tenantId) {
      config.headers.set?.("X-Tenant-Id", tenantId);
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalRequest = error.config as (InternalAxiosRequestConfig & {
        _retry?: boolean;
        skipAuthRefresh?: boolean;
      });

      if (
        status === 401 &&
        options.refreshAccessToken &&
        !originalRequest?._retry &&
        !originalRequest?.skipAuthRefresh
      ) {
        originalRequest._retry = true;
        const newToken = await requestNewAccessToken();

        if (newToken) {
          originalRequest.headers.set?.("Authorization", `Bearer ${newToken}`);
          return instance.request(originalRequest);
        }
      }

      if (status === 401) {
        options.onUnauthorized?.(error);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const isApiError = (error: unknown): error is AxiosError => axios.isAxiosError(error);

export type ApiErrorPayload = {
  status?: number;
  message?: string;
  data?: unknown;
};

export const extractApiError = (error: unknown): ApiErrorPayload => {
  if (!isApiError(error)) {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  return {
    status: error.response?.status,
    message:
      typeof error.response?.data === "object" && error.response?.data !== null
        ? (error.response?.data as { message?: string }).message ??
          error.message ??
          "Unexpected error"
        : error.message,
    data: error.response?.data,
  };
};

export const createAuthenticatedRequestConfig = (
  token: string | null,
  tenantId?: string | null
): AxiosRequestConfig => {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    headers["X-Tenant-Id"] = tenantId;
  }

  return { headers };
};

export * from "./identity";