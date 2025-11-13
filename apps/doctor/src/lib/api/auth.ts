import { doctorApiClient } from "../api-client";
import { createIdentityApi } from "@illajwala/api-client";
import type { LoginDoctorInput } from "@illajwala/types";

const identityApi = createIdentityApi(doctorApiClient);

export const doctorAuthApi = {
  login: (payload: LoginDoctorInput) => identityApi.loginDoctor(payload),
  refreshSession: () => identityApi.refreshSession(),
  logout: () => identityApi.logout(),
};

