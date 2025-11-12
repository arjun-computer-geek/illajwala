import { Router } from "express";
import { handleGetPlatformOverview } from "./stats.controller";

export const statsRouter = Router();

statsRouter.get("/overview", handleGetPlatformOverview);


