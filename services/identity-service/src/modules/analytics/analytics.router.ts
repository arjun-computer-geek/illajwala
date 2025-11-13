"use strict";

import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { handleGetOpsPulse, handleGetOpsSeries } from "./analytics.controller";

export const analyticsRouter: Router = Router();

analyticsRouter.get("/ops/pulse", requireAuth(["admin"]), handleGetOpsPulse);
analyticsRouter.get("/ops/series", requireAuth(["admin"]), handleGetOpsSeries);


