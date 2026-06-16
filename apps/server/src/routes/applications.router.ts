import express from "express";

import {
  acceptApplicationController,
  getIncomingApplicationsController,
  getMyApplicationsController,
  rejectApplicationController,
} from "../controllers/applications.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { applicationIdParamsSchema } from "../validators/application.validator.js";

export const applicationsRouter: express.Router = express.Router();

applicationsRouter.use(authMiddleware);

applicationsRouter.get("/me", getMyApplicationsController);
applicationsRouter.get("/incoming", getIncomingApplicationsController);

applicationsRouter.patch(
  "/:id/accept",
  validate(applicationIdParamsSchema),
  acceptApplicationController
);

applicationsRouter.patch(
  "/:id/reject",
  validate(applicationIdParamsSchema),
  rejectApplicationController
);