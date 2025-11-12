"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setDoctorTenant } from "./api-client";

export const useTenantBootstrap = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const clinicFromQuery = searchParams.get("clinic");
    if (clinicFromQuery) {
      setDoctorTenant(clinicFromQuery);
    }
  }, [searchParams]);
};

