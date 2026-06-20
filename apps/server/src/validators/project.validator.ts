import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const projectFileSchema = z
  .object({
    fileName: z.string().min(1).max(255),
    fileType: z.string().min(1).max(120),
    fileSize: z.number().int().positive().max(2 * 1024 * 1024),
    fileData: z.string().min(1).max(3_000_000).startsWith("data:"),
  })
  .strict();

export const projectIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid project id"),
  }),
});

export const createProjectSchema = z.object({
  body: z
    .object({
      title: z.string().min(2).max(160),
      description: z.string().min(10),
      deadline: dateSchema.optional(),
      requiredSkillIds: z.array(z.string().uuid()).optional(),
      files: z.array(projectFileSchema).max(3).optional(),
    })
    .strict(),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid project id"),
  }),
  body: z
    .object({
      title: z.string().min(2).max(160).optional(),
      description: z.string().min(10).optional(),
      status: z.enum(["open", "in_progress", "completed", "closed"]).optional(),
      deadline: dateSchema.optional(),
      requiredSkillIds: z.array(z.string().uuid()).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export type ProjectIdParams = z.infer<typeof projectIdParamsSchema>["params"];
export type CreateProjectBody = z.infer<typeof createProjectSchema>["body"];
export type UpdateProjectBody = z.infer<typeof updateProjectSchema>["body"];