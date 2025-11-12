"use client";

import { useTenantBootstrap } from "../lib/tenant";
import { useDoctorAuth } from "../hooks/use-auth";

export const TenantBootstrapper = () => {
  useTenantBootstrap();
  useDoctorAuth();
  return null;
};

