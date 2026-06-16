import express from "express";

import {
  deleteMeController,
  getMeController,
  getUserByIdController,
  getUsersController,
  updateMeController,
} from "../controllers/users.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  updateMeSchema,
  userIdParamsSchema,
} from "../validators/user.validator.js";
import {
  getMySkillsController,
  getUserSkillsController,
  updateMySkillsController,
} from "../controllers/skills.controller.js";
import { updateUserSkillsSchema } from "../validators/skill.validator.js";

export const usersRouter: express.Router = express.Router();

usersRouter.use(authMiddleware);

usersRouter.use(authMiddleware);

usersRouter.get("/", getUsersController);
usersRouter.get("/me", getMeController);
usersRouter.get("/me/skills", getMySkillsController);
usersRouter.patch("/me", validate(updateMeSchema), updateMeController);
usersRouter.patch(
  "/me/skills",
  validate(updateUserSkillsSchema),
  updateMySkillsController
);
usersRouter.delete("/me", deleteMeController);

usersRouter.get(
  "/:id/skills",
  validate(userIdParamsSchema),
  getUserSkillsController
);
usersRouter.get("/:id", validate(userIdParamsSchema), getUserByIdController);