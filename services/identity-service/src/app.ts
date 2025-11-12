import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProd } from "./config/env";
import { rootRouter } from "./modules/routes";
import { notFoundHandler } from "./middlewares/not-found";
import { errorHandler } from "./middlewares/error-handler";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL ?? "*",
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan(isProd ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", rootRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };

