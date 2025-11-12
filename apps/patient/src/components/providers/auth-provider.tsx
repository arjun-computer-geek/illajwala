"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/hooks/use-auth";

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const interceptorId = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          clearAuth();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptorId);
    };
  }, [clearAuth, hydrated]);

  return <>{children}</>;
};


