import express, { type Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { clientOrigins, env, isProd } from "./config/env";
import { rootRouter } from "./modules/routes";
import { notFoundHandler } from "./middlewares/not-found";
import { errorHandler } from "./middlewares/error-handler";
import { metricsHandler } from "./metrics";

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
  })
);
app.use(helmet());
app.use(morgan(isProd ? "combined" : "dev"));
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buffer) => {
      if (buffer?.length) {
        req.rawBody = buffer.toString("utf-8");
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/metrics", metricsHandler);

app.use("/api", rootRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };

