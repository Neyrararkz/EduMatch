import { type RequestHandler } from "express";

import {
  acceptProjectApplication,
  getIncomingProjectApplications,
  getMyProjectApplications,
  rejectProjectApplication,
  submitProjectApplication,
} from "../services/applications.service.js";
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

export const createProjectApplicationController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequiredUserId(req.user?.userId);
    const projectId = getStringParam(req.params.id, "Project id");

    const application = await submitProjectApplication(projectId, userId, req.body);

    res.status(201).json({ application });
  } catch (error) {
    next(error);
  }
};

export const getMyApplicationsController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequiredUserId(req.user?.userId);

    const applications = await getMyProjectApplications(userId);

    res.status(200).json({ applications });
  } catch (error) {
    next(error);
  }
};

export const getIncomingApplicationsController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequiredUserId(req.user?.userId);

    const applications = await getIncomingProjectApplications(userId);

    res.status(200).json({ applications });
  } catch (error) {
    next(error);
  }
};

export const acceptApplicationController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequiredUserId(req.user?.userId);
    const applicationId = getStringParam(req.params.id, "Application id");

    const application = await acceptProjectApplication(applicationId, userId);

    res.status(200).json({ application });
  } catch (error) {
    next(error);
  }
};

export const rejectApplicationController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequiredUserId(req.user?.userId);
    const applicationId = getStringParam(req.params.id, "Application id");

    const application = await rejectProjectApplication(applicationId, userId);

    res.status(200).json({ application });
  } catch (error) {
    next(error);
  }
};