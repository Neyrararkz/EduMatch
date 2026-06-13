import express from "express";

import {
  createProjectController,
  deleteProjectController,
  getMyProjectsController,
  getProjectByIdController,
  getProjectsController,
  updateProjectController,
} from "../controllers/projects.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createProjectSchema,
  projectIdParamsSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";

export const projectsRouter: express.Router = express.Router();

projectsRouter.use(authMiddleware);

projectsRouter.post("/", validate(createProjectSchema), createProjectController);
projectsRouter.get("/", getProjectsController);
projectsRouter.get("/my", getMyProjectsController);

projectsRouter.get(
  "/:id",
  validate(projectIdParamsSchema),
  getProjectByIdController
);

projectsRouter.patch("/:id", validate(updateProjectSchema), updateProjectController);

projectsRouter.delete(
  "/:id",
  validate(projectIdParamsSchema),
  deleteProjectController
);