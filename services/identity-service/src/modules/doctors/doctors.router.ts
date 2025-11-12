import { Router } from "express";
import {
  handleCreateDoctor,
  handleGetDoctor,
  handleListSpecialties,
  handleSearchDoctors,
  handleUpdateDoctor,
  handleGetDoctorAvailability,
} from "./doctors.controller";
import { requireAuth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validate-request";
import {
  createDoctorSchema,
  doctorAvailabilitySchema,
  doctorSearchSchema,
  updateDoctorSchema,
} from "./doctor.schema";

export const doctorRouter = Router();

doctorRouter.get("/specialties", handleListSpecialties);
doctorRouter.get("/", validateRequest({ query: doctorSearchSchema }), handleSearchDoctors);
doctorRouter.get("/:id", handleGetDoctor);
doctorRouter.get(
  "/:id/availability",
  validateRequest({ query: doctorAvailabilitySchema }),
  handleGetDoctorAvailability
);
doctorRouter.post(
  "/",
  requireAuth(["admin"]),
  validateRequest({ body: createDoctorSchema }),
  handleCreateDoctor
);
doctorRouter.patch(
  "/:id",
  requireAuth(["doctor", "admin"]),
  validateRequest({ body: updateDoctorSchema }),
  handleUpdateDoctor
);

