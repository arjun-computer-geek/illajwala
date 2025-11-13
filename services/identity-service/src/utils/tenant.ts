import type { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "./app-error";

export const TENANT_HEADER = "x-tenant-id";

type TenantCarrier = Request & {
  user?: {
    tenantId?: string | null;
  };
  tenantId?: string | null;
};

const normalizeTenantHeader = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return normalizeTenantHeader(value[0]);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const getTenantIdFromHeaders = (req: Request): string | null =>
  normalizeTenantHeader(req.headers[TENANT_HEADER] ?? req.headers[TENANT_HEADER.toLowerCase()]);

type ResolveTenantOptions = {
  required?: boolean;
  enforceTokenMatch?: boolean;
  allowHeaderFallback?: boolean;
};

export const resolveTenantId = (
  req: TenantCarrier,
  {
    required = false,
    enforceTokenMatch = true,
    allowHeaderFallback = true,
  }: ResolveTenantOptions = {}
): string | null => {
  const tokenTenant = req.user?.tenantId ?? req.tenantId ?? null;
  const headerTenant = allowHeaderFallback ? getTenantIdFromHeaders(req) : null;

  if (enforceTokenMatch && tokenTenant && headerTenant && tokenTenant !== headerTenant) {
    throw AppError.from({
      statusCode: StatusCodes.FORBIDDEN,
      message: "Tenant context mismatch between token and request header",
    });
  }

  const tenantId = tokenTenant ?? headerTenant ?? null;

  if (required && !tenantId) {
    throw AppError.from({
      statusCode: StatusCodes.BAD_REQUEST,
      message: "Tenant context (X-Tenant-Id) is required",
    });
  }

  return tenantId;
};

export const requireTenantId = (req: TenantCarrier, options?: Omit<ResolveTenantOptions, "required">): string =>
  resolveTenantId(req, { ...options, required: true }) as string;


