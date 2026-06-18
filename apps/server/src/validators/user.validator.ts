import { z } from "zod";

const avatarUrlSchema = z.string().max(5_000_000).refine((value) => {
  if (value.startsWith("data:image/")) {
    return true;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}, "Invalid avatar image");

export const userIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user id"),
  }),
});

export const updateMeSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2).max(120).optional(),
      avatarUrl: avatarUrlSchema.optional(),
      about: z.string().max(1000).optional(),
      university: z.string().max(255).optional(),
      course: z.coerce.number().int().positive().max(10).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>["params"];
export type UpdateMeBody = z.infer<typeof updateMeSchema>["body"];