"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { setAdminTenant } from "@/lib/api-client";
import { adminAppConfig } from "@/lib/config";

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  useEffect(() => {
    setAdminTenant(adminAppConfig.defaultTenantId);
  }, []);

  return <QueryProvider>{children}</QueryProvider>;
};


