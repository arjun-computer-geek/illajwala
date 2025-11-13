"use strict";

import client from "prom-client";
import type { Request, Response } from "express";
import type { ConsultationEvent } from "./types/consultation-event";

const registry = new client.Registry();

client.collectDefaultMetrics({ register: registry });

const queueDepthGauge = new client.Gauge({
  name: "messaging_consultation_queue_depth",
  help: "Number of pending consultation notification jobs",
  registers: [registry],
});

const jobDurationHistogram = new client.Histogram({
  name: "messaging_notification_job_duration_seconds",
  help: "Processing time for consultation notification jobs",
  labelNames: ["event"],
  registers: [registry],
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10],
});

const jobFailuresCounter = new client.Counter({
  name: "messaging_notification_job_failures_total",
  help: "Total number of failed notification jobs",
  labelNames: ["event"],
  registers: [registry],
});

export const recordQueueDepth = (depth: number) => {
  queueDepthGauge.set(depth);
};

export const recordJobDuration = (event: ConsultationEvent["type"], milliseconds: number) => {
  jobDurationHistogram.observe({ event }, milliseconds / 1000);
};

export const recordJobFailure = (event: ConsultationEvent["type"]) => {
  jobFailuresCounter.inc({ event });
};

export const metricsHandler = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", registry.contentType);
  res.end(await registry.metrics());
};


