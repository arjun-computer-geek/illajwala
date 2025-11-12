import { Router } from "express";
import {
  handleAddDependent,
  handleGetProfile,
  handleRemoveDependent,
  handleUpdateProfile,
} from "./patients.controller";
import { requireAuth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validate-request";
import { addDependentSchema, updatePatientSchema } from "./patient.schema";

export const patientRouter = Router();

patientRouter.get("/me", requireAuth(["patient"]), handleGetProfile);
patientRouter.patch(
  "/me",
  requireAuth(["patient"]),
  validateRequest({ body: updatePatientSchema }),
  handleUpdateProfile
);
patientRouter.post(
  "/me/dependents",
  requireAuth(["patient"]),
  validateRequest({ body: addDependentSchema }),
  handleAddDependent
);
patientRouter.delete("/me/dependents/:name", requireAuth(["patient"]), handleRemoveDependent);

