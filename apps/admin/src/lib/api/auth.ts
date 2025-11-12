import { adminApiClient } from "../api-client";
import { createIdentityApi } from "@illajwala/api-client";
import type { LoginAdminInput } from "@illajwala/types";

const identityApi = createIdentityApi(adminApiClient);

export const adminAuthApi = {
  login: (payload: LoginAdminInput) => identityApi.loginAdmin(payload),
};

