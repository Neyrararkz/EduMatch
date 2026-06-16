import { z } from "zod";

export const createApplicationSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid project id"),
  }),
  body: z
    .object({
      message: z.string().max(1000).optional(),
    })
    .strict(),
});

export const applicationIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid application id"),
  }),
});

export type CreateApplicationBody = z.infer<typeof createApplicationSchema>["body"];