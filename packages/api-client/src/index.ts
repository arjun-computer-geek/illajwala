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
    (error: AxiosError) => {
      if (error.response?.status === 401) {
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