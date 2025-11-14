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
import { moderateRateLimit } from "../../middlewares/rate-limit";
import { cache } from "../../middlewares/cache";
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

doctorRouter.get("/specialties", moderateRateLimit, cache({ ttlSeconds: 600 }), handleListSpecialties);
doctorRouter.get(
  "/",
  moderateRateLimit,
  cache({ ttlSeconds: 300 }),
  validateRequest({ query: doctorSearchSchema }),
  handleSearchDoctors
);
doctorRouter.get("/:id", moderateRateLimit, cache({ ttlSeconds: 300 }), handleGetDoctor);
doctorRouter.get(
  "/:id/availability",
  moderateRateLimit,
  cache({ ttlSeconds: 60 }),
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

