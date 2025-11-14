// Re-export from shared package
export {
  AppError,
  successResponse,
  paginateResponse,
  catchAsync,
  getTenantIdFromHeaders,
  resolveTenantId,
  requireTenantId,
  TENANT_HEADER,
} from '@illajwala/shared';

// Re-export AuthenticatedRequest type
export type { AuthenticatedRequest } from '@illajwala/shared';
