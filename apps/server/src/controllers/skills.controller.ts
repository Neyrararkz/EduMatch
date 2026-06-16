import { type RequestHandler } from "express";

import {
  getSkills,
  getSkillsByUserId,
  updateSkillsForUser,
} from "../services/skills.service.js";

function getStringParam(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export const getSkillsController: RequestHandler = async (_req, res, next) => {
  try {
    const skills = await getSkills();

    res.status(200).json({ skills });
  } catch (error) {
    next(error);
  }
};

export const getMySkillsController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const skills = await getSkillsByUserId(userId);

    res.status(200).json({ skills });
  } catch (error) {
    next(error);
  }
};

export const updateMySkillsController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const skills = await updateSkillsForUser(userId, req.body);

    res.status(200).json({ skills });
  } catch (error) {
    next(error);
  }
};

export const getUserSkillsController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getStringParam(req.params.id);

    if (!userId) {
      res.status(400).json({ message: "User id is required" });
      return;
    }

    const skills = await getSkillsByUserId(userId);

    res.status(200).json({ skills });
  } catch (error) {
    next(error);
  }
};