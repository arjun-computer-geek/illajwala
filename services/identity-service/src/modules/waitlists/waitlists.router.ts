import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validate-request";
import {
  createWaitlistEntrySchema,
  listWaitlistQuerySchema,
  promoteWaitlistEntrySchema,
  updateWaitlistStatusSchema,
  upsertWaitlistPolicySchema,
  waitlistIdParamSchema,
  waitlistPatientParamSchema,
  waitlistPolicyQuerySchema,
} from "./waitlist.schema";
import {
  handleCreateWaitlistEntry,
  handleGetPatientWaitlists,
  handleGetWaitlistEntry,
  handleListWaitlistEntries,
  handlePromoteWaitlistEntry,
  handleUpdateWaitlistStatus,
  handleUpsertWaitlistPolicy,
  handleGetWaitlistPolicy,
} from "./waitlists.controller";

export const waitlistRouter: Router = Router();

waitlistRouter.post(
  "/",
  requireAuth(["patient", "admin"]),
  validateRequest({ body: createWaitlistEntrySchema }),
  handleCreateWaitlistEntry
);

waitlistRouter.get("/", requireAuth(["admin", "doctor"]), validateRequest({ query: listWaitlistQuerySchema }), handleListWaitlistEntries);

waitlistRouter.get(
  "/policy",
  requireAuth(["admin"]),
  validateRequest({ query: waitlistPolicyQuerySchema }),
  handleGetWaitlistPolicy
);

waitlistRouter.put(
  "/policy",
  requireAuth(["admin"]),
  validateRequest({ body: upsertWaitlistPolicySchema }),
  handleUpsertWaitlistPolicy
);

waitlistRouter.get(
  "/patients/:patientId",
  requireAuth(["patient", "admin"]),
  validateRequest({ params: waitlistPatientParamSchema }),
  handleGetPatientWaitlists
);

waitlistRouter.get(
  "/:id",
  requireAuth(["admin"]),
  validateRequest({ params: waitlistIdParamSchema }),
  handleGetWaitlistEntry
);

waitlistRouter.patch(
  "/:id/status",
  requireAuth(["admin", "doctor"]),
  validateRequest({ params: waitlistIdParamSchema, body: updateWaitlistStatusSchema }),
  handleUpdateWaitlistStatus
);

waitlistRouter.post(
  "/:id/promote",
  requireAuth(["admin", "doctor"]),
  validateRequest({ params: waitlistIdParamSchema, body: promoteWaitlistEntrySchema }),
  handlePromoteWaitlistEntry
);

