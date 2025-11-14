import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { createLogger } from '@illajwala/shared';
import type { ServiceConfig } from './config';

export interface ServiceClientOptions {
  baseURL: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  getAuthToken?: () => string | null;
  getTenantId?: () => string | null;
  logRequests?: boolean;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number | null;
  isOpen: boolean;
}

export class ServiceClient {
  private client: AxiosInstance;
  private logger: ReturnType<typeof createLogger>;
  private circuitBreaker: CircuitBreakerState;
  private config: ServiceClientOptions;
  private circuitBreakerThreshold: number;
  private circuitBreakerTimeout: number;

  constructor(options: ServiceClientOptions, serviceConfig?: Partial<ServiceConfig>) {
    this.config = {
      timeout: serviceConfig?.timeout ?? 30000,
      maxRetries: serviceConfig?.maxRetries ?? 3,
      retryDelay: serviceConfig?.retryDelay ?? 1000,
      logRequests: true,
      ...options,
    };

    this.circuitBreakerThreshold = serviceConfig?.circuitBreakerThreshold ?? 5;
    this.circuitBreakerTimeout = serviceConfig?.circuitBreakerTimeout ?? 60000;

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      isOpen: false,
    };

    this.logger = createLogger({
      isProd: process.env.NODE_ENV === 'production',
    });

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth and tenant headers
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.config.getAuthToken?.();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        const tenantId = this.config.getTenantId?.();
        if (tenantId) {
          config.headers['X-Tenant-Id'] = tenantId;
        }

        // Add service-to-service header to identify internal requests
        config.headers['X-Service-Request'] = 'true';

        if (this.config.logRequests) {
          this.logger.debug('Service request', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
          });
        }

        return config;
      },
      (error) => {
        this.logger.error('Service request error', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor - handle errors and logging
    this.client.interceptors.response.use(
      (response) => {
        if (this.config.logRequests) {
          this.logger.debug('Service response', {
            status: response.status,
            url: response.config.url,
          });
        }
        this.resetCircuitBreaker();
        return response;
      },
      (error: AxiosError) => {
        if (this.config.logRequests) {
          this.logger.error('Service response error', error, {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message,
          });
        }
        this.recordFailure();
        return Promise.reject(error);
      },
    );
  }

  private resetCircuitBreaker(): void {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.lastFailureTime = null;
  }

  private recordFailure(): void {
    this.circuitBreaker.failures += 1;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreakerThreshold) {
      this.circuitBreaker.isOpen = true;
      this.logger.warn('Circuit breaker opened', {
        failures: this.circuitBreaker.failures,
        threshold: this.circuitBreakerThreshold,
      });
    }
  }

  private shouldRetry(error: AxiosError, attempt: number): boolean {
    if (attempt >= (this.config.maxRetries ?? 3)) {
      return false;
    }

    // Don't retry on 4xx errors (client errors)
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }

    // Retry on network errors, timeouts, and 5xx errors
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNREFUSED'
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreaker.isOpen) {
      return false;
    }

    // Check if circuit breaker timeout has elapsed
    if (
      this.circuitBreaker.lastFailureTime &&
      Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreakerTimeout
    ) {
      this.logger.info('Circuit breaker timeout elapsed, attempting half-open state');
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = Math.floor(this.circuitBreakerThreshold / 2);
      return false;
    }

    return true;
  }

  async request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      const error = new Error('Circuit breaker is open') as AxiosError;
      error.response = {
        status: 503,
        statusText: 'Service Unavailable',
        data: { message: 'Service is temporarily unavailable' },
        headers: {},
        config: {} as AxiosRequestConfig,
      } as AxiosError['response'];
      throw error;
    }

    let lastError: AxiosError | null = null;
    const maxAttempts = (this.config.maxRetries ?? 3) + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.client.request<T>(config);
        return response.data;
      } catch (error) {
        lastError = error as AxiosError;

        if (!this.shouldRetry(lastError, attempt)) {
          throw error;
        }

        // Calculate exponential backoff delay
        const delayMs = this.config.retryDelay! * Math.pow(2, attempt - 1);
        this.logger.warn(`Request failed, retrying in ${delayMs}ms`, {
          attempt,
          maxAttempts,
          error: lastError.message,
          url: config.url,
        });

        await this.delay(delayMs);
      }
    }

    throw lastError;
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

export function createServiceClient(
  options: ServiceClientOptions,
  serviceConfig?: Partial<ServiceConfig>,
): ServiceClient {
  return new ServiceClient(options, serviceConfig);
}
