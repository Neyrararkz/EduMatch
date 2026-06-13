import { type RequestHandler } from "express";

import {
  createProjectForUser,
  deleteProjectForUser,
  getMyProjects,
  getProject,
  getProjects,
  updateProjectForUser,
} from "../services/projects.service.js";

function getRequiredUserId(req: Parameters<RequestHandler>[0]): string | null {
  return req.user?.userId ?? null;
}

function getStringParam(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export const getProjectsController: RequestHandler = async (_req, res, next) => {
  try {
    const projects = await getProjects();

    res.status(200).json({ projects });
  } catch (error) {
    next(error);
  }
};

export const getMyProjectsController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequiredUserId(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const projects = await getMyProjects(userId);

    res.status(200).json({ projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const projectId = getStringParam(req.params.id);

    if (!projectId) {
      res.status(400).json({ message: "Project id is required" });
      return;
    }

    const project = await getProject(projectId);

    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
};

export const createProjectController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequiredUserId(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const project = await createProjectForUser(userId, req.body);

    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
};

export const updateProjectController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequiredUserId(req);
    const projectId = getStringParam(req.params.id);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!projectId) {
      res.status(400).json({ message: "Project id is required" });
      return;
    }

    const project = await updateProjectForUser(projectId, userId, req.body);

    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
};

export const deleteProjectController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getRequiredUserId(req);
    const projectId = getStringParam(req.params.id);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!projectId) {
      res.status(400).json({ message: "Project id is required" });
      return;
    }

    await deleteProjectForUser(projectId, userId);

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};