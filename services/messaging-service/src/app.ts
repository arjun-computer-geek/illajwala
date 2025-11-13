import express from "express";
import type { Request, Response } from "express";
import { metricsHandler } from "./modules/metrics";

/**
 * Messaging service API skeleton.
 *
 * Sprint 3 needs only lightweight health & diagnostics endpoints while we wire
 * consultation events into the queue workers. Future sprints will expose
 * template management and resend hooks here.
 */
export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "messaging-service" });
  });

  app.get("/metrics", metricsHandler);

  return app;
};


