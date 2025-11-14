'use strict';

import client from 'prom-client';
import type { Request, Response } from 'express';

const registry = new client.Registry();

client.collectDefaultMetrics({
  register: registry,
});

export const metricsHandler = async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', registry.contentType);
  res.end(await registry.metrics());
};
