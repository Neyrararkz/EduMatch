import { type RequestHandler } from "express";

import {
  deleteCurrentUser,
  getUserById,
  getUsers,
  updateCurrentUser,
} from "../services/users.service.js";

export const getUsersController: RequestHandler = async (_req, res, next) => {
  try {
    const users = await getUsers();

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const getMeController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await getUserById(userId);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const getUserByIdController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (typeof userId !== "string") {
      res.status(400).json({
        message: "User id is required",
      });
      return;
    }

    const user = await getUserById(userId);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateMeController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await updateCurrentUser(userId, req.body);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const deleteMeController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await deleteCurrentUser(userId);

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};