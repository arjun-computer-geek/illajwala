import { Router } from "express";
import {
  handleLoginDoctor,
  handleLoginPatient,
  handleRegisterPatient,
  handleLoginAdmin,
  handleRefreshSession,
  handleLogout,
} from "./auth.controller";
import { validateRequest } from "../../middlewares/validate-request";
import {
  loginDoctorSchema,
  loginPatientSchema,
  loginAdminSchema,
  registerPatientSchema,
} from "./auth.schema";

export const authRouter = Router();

authRouter.post(
  "/patient/register",
  validateRequest({ body: registerPatientSchema }),
  handleRegisterPatient
);
authRouter.post(
  "/patient/login",
  validateRequest({ body: loginPatientSchema }),
  handleLoginPatient
);
authRouter.post(
  "/doctor/login",
  validateRequest({ body: loginDoctorSchema }),
  handleLoginDoctor
);
authRouter.post(
  "/admin/login",
  validateRequest({ body: loginAdminSchema }),
  handleLoginAdmin
);
authRouter.post("/refresh", handleRefreshSession);
authRouter.post("/logout", handleLogout);

