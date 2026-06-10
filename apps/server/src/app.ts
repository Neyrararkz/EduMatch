import express, {
  type ErrorRequestHandler,
  type Express,
  type RequestHandler,
} from "express";
import cors from "cors";

import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.router.js";

const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
};

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[Error]", err);

  res.status(500).json({
    message: "Internal server error",
  });
};

export const createApp = (): Express => {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};