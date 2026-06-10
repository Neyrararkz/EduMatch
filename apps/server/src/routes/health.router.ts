import express, { type RequestHandler } from "express";

export const healthRouter: express.Router = express.Router();

const getHealth: RequestHandler = (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
};

healthRouter.get("/health", getHealth);