import express from "express";

import {
  getNotificationsSummaryController,
  markProjectMessagesAsReadController,
} from "../controllers/notifications.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { projectIdParamsSchema } from "../validators/project.validator.js";

export const notificationsRouter: express.Router = express.Router();

notificationsRouter.use(authMiddleware);

notificationsRouter.get("/summary", getNotificationsSummaryController);

notificationsRouter.post(
  "/projects/:id/read",
  validate(projectIdParamsSchema),
  markProjectMessagesAsReadController
);