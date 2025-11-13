"use client";

import { useEffect } from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth-provider";
import { setTenantContext } from "@/lib/api-client";
import { appConfig } from "@/lib/config";

type AppProvidersProps = {
  children: React.ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  useEffect(() => {
    setTenantContext(appConfig.defaultTenantId);
  }, []);

  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
};

