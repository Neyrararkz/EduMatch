import { type RequestHandler } from "express";

import {
  getNotificationsSummary,
  markProjectMessagesAsRead,
} from "../services/notifications.service.js";

function getRequestUserId(req: Parameters<RequestHandler>[0]) {
  const requestUser = req.user as { userId?: string; id?: string } | undefined;
  return requestUser?.userId ?? requestUser?.id ?? "";
}

export const getNotificationsSummaryController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequestUserId(req);
    const summary = await getNotificationsSummary(userId);

    res.json({ summary });
  } catch (error) {
    next(error);
  }
};

export const markProjectMessagesAsReadController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequestUserId(req);
    const projectId = req.params.id;

    if (typeof projectId !== "string") {
      res.status(400).json({ message: "Invalid project id" });
      return;
    }

    await markProjectMessagesAsRead(projectId, userId);

    res.json({ message: "Project messages marked as read" });
  } catch (error) {
    next(error);
  }
};