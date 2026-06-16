import express from "express";

import { getSkillsController } from "../controllers/skills.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const skillsRouter: express.Router = express.Router();

skillsRouter.use(authMiddleware);

skillsRouter.get("/", getSkillsController);