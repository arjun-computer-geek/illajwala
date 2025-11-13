import { Router } from "express";
import {
  handleCreateDoctor,
  handleGetDoctor,
  handleListSpecialties,
  handleSearchDoctors,
  handleUpdateDoctor,
  handleGetDoctorAvailability,
  handleReviewDoctor,
  handleAddDoctorNote,
  handleUpdateDoctorProfile,
} from "./doctors.controller";
import { requireAuth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validate-request";
import {
  createDoctorSchema,
  doctorAvailabilitySchema,
  doctorSearchSchema,
  adminUpdateDoctorSchema,
  doctorReviewActionSchema,
  doctorAddNoteSchema,
  doctorProfileUpdateSchema,
} from "./doctor.schema";

export const doctorRouter: Router = Router();

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
  requireAuth(["admin"]),
  validateRequest({ body: adminUpdateDoctorSchema }),
  handleUpdateDoctor
);
doctorRouter.patch(
  "/me/profile",
  requireAuth(["doctor"]),
  validateRequest({ body: doctorProfileUpdateSchema }),
  handleUpdateDoctorProfile
);
doctorRouter.post(
  "/:id/review",
  requireAuth(["admin"]),
  validateRequest({ body: doctorReviewActionSchema }),
  handleReviewDoctor
);
doctorRouter.post(
  "/:id/notes",
  requireAuth(["admin"]),
  validateRequest({ body: doctorAddNoteSchema }),
  handleAddDoctorNote
);

