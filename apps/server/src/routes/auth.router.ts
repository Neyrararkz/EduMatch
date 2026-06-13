import express from "express";

import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from "../validators/auth.validator.js";

export const authRouter: express.Router = express.Router();

authRouter.post("/register", validate(registerSchema), registerController);
authRouter.post("/login", validate(loginSchema), loginController);
authRouter.post("/refresh", validate(refreshSchema), refreshController);
authRouter.post("/logout", validate(logoutSchema), logoutController);
authRouter.get("/me", authMiddleware, meController);