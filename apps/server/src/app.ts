import express, {
  type ErrorRequestHandler,
  type Express,
  type RequestHandler,
} from "express";
import cors from "cors";

import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.router.js";
import { authRouter } from "./routes/auth.router.js";
import { usersRouter } from "./routes/users.router.js";
import { projectsRouter } from "./routes/projects.router.js";
import { AppError } from "./utils/app-error.js";
import { skillsRouter } from "./routes/skills.router.js";

const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
};

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[Error]", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      errors: err.errors,
    });
    return;
  }

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
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/skills", skillsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};