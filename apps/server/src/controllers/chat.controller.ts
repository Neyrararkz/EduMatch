import { type RequestHandler } from "express";

import { getMessagesForProject } from "../services/chat.service.js";
import { AppError } from "../utils/app-error.js";

function getRequiredUserId(userId: string | undefined): string {
  if (!userId) {
    throw new AppError(401, "Unauthorized");
  }

  return userId;
}

function getStringParam(value: unknown, name: string): string {
  if (typeof value !== "string") {
    throw new AppError(400, `${name} is required`);
  }

  return value;
}

export const getProjectMessagesController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequiredUserId(req.user?.userId);
    const projectId = getStringParam(req.params.id, "Project id");

    const messages = await getMessagesForProject(projectId, userId);

    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};