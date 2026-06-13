import { type RequestHandler } from "express";
import { type ZodType } from "zod";

import { AppError } from "../utils/app-error.js";

type ParsedRequestData = {
  body?: unknown;
  params?: unknown;
  query?: unknown;
};

export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(new AppError(400, "Validation error", result.error.issues));
    }

    const data = result.data as ParsedRequestData;

    if (data.body) req.body = data.body;
    if (data.params) req.params = data.params as typeof req.params;
    if (data.query) req.query = data.query as typeof req.query;

    return next();
  };
}