import { type RequestHandler } from "express";

import { AppError } from "../utils/app-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "Authorization token is required"));
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new AppError(401, "Authorization token is required"));
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired token"));
  }
};