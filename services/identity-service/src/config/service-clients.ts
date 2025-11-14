import {
  createAppointmentServiceClient,
  createPaymentServiceClient,
  createProviderServiceClient,
  createAnalyticsServiceClient,
  createStorageServiceClient,
  type ServiceClientOptions,
} from '@illajwala/service-client';
import type { Request } from 'express';
import type { AuthenticatedRequest } from '../utils';

// Get auth token from request
const getAuthToken = (req?: Request): string | null => {
  if (!req) return null;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// Get tenant ID from request (prefer user.tenantId, then headers)
const getTenantId = (req?: Request): string | null => {
  if (!req) return null;
  // Try to get from authenticated user first
  const authenticatedReq = req as AuthenticatedRequest;
  if (authenticatedReq.user?.tenantId) {
    return authenticatedReq.user.tenantId;
  }
  // Fall back to header
  const tenantId = req.headers['x-tenant-id'];
  return typeof tenantId === 'string' ? tenantId : null;
};

// Create service client options from request
const createServiceClientOptions = (req?: Request): Partial<ServiceClientOptions> => {
  return {
    getAuthToken: () => getAuthToken(req),
    getTenantId: () => getTenantId(req),
  };
};

// Create service clients
export const createServiceClients = (req?: Request) => {
  const options = createServiceClientOptions(req);
  return {
    appointment: createAppointmentServiceClient(options),
    payment: createPaymentServiceClient(options),
    provider: createProviderServiceClient(options),
    analytics: createAnalyticsServiceClient(options),
    storage: createStorageServiceClient(options),
  };
};

// Singleton service clients (for use without request context)
let serviceClients: ReturnType<typeof createServiceClients> | null = null;

export const getServiceClients = (req?: Request) => {
  if (req) {
    return createServiceClients(req);
  }
  if (!serviceClients) {
    serviceClients = createServiceClients();
  }
  return serviceClients;
};
