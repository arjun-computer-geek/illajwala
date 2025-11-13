"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setDoctorTenant } from "./api-client";
import { doctorAppConfig } from "./config";

export const useTenantBootstrap = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const clinicFromQuery = searchParams.get("clinic");
    if (clinicFromQuery) {
      setDoctorTenant(clinicFromQuery);
      return;
    }

    if (doctorAppConfig.defaultTenantId) {
      setDoctorTenant(doctorAppConfig.defaultTenantId);
    }
  }, [searchParams]);
};

