import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { handleGetPlatformOverview } from "./stats.controller";

export const statsRouter: ExpressRouter = Router();

statsRouter.get("/overview", handleGetPlatformOverview);


