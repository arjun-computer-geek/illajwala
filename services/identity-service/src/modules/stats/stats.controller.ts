import type { Request, Response, RequestHandler } from "express";
import { successResponse } from "../../utils/api-response";
import { catchAsync } from "../../utils/catch-async";
import { getPlatformOverview } from "./stats.service";

export const handleGetPlatformOverview: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const overview = await getPlatformOverview();
  return res.json(successResponse(overview));
});


