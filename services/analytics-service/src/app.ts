import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { clientOrigins, isProd } from './config/env';
import { rootRouter } from './modules/routes';
import { notFoundHandler, errorHandler, sanitizeInput, requestLogger } from './middlewares';
import { metricsHandler } from './metrics';

const app: Application = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);
// Enhanced Helmet configuration for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API compatibility
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);
app.use(compression());
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(
  express.json({
    limit: '1mb',
  }),
);
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Request logging (before routes to capture all requests)
app.use(requestLogger);

app.get('/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Check database connection
    const mongoose = await import('mongoose');
    health.services.database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch {
    health.services.database = 'error';
  }

  try {
    // Check Redis connection
    const { redis } = await import('./config/redis.js');
    await redis.ping();
    health.services.redis = redis.status === 'ready' ? 'connected' : 'disconnected';
  } catch {
    health.services.redis = 'disconnected';
  }

  const allHealthy =
    health.services.database === 'connected' && health.services.redis === 'connected';
  res.status(allHealthy ? 200 : 503).json(health);
});

// Readiness probe - checks if service is ready to accept traffic
app.get('/health/ready', async (_req, res) => {
  const checks = {
    database: false,
    redis: false,
  };

  try {
    const mongoose = await import('mongoose');
    checks.database = mongoose.connection.readyState === 1;
  } catch {
    checks.database = false;
  }

  try {
    const { redis } = await import('./config/redis');
    await redis.ping();
    checks.redis = redis.status === 'ready';
  } catch {
    checks.redis = false;
  }

  const isReady = checks.database && checks.redis;
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// Liveness probe - checks if service is alive
app.get('/health/live', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/metrics', metricsHandler);

// Apply input sanitization to API routes only (skip health/metrics)
app.use('/api', sanitizeInput);
app.use('/api', rootRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
