import { type NextFunction, type Request, type Response } from "express";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../services/auth.service.js";

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await registerUser(req.body);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await loginUser(req.body);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await refreshAccessToken(req.body);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await logoutUser(req.body);

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function meController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const user = await getCurrentUser(userId);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}