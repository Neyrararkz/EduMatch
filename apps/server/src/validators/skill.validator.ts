import { z } from "zod";

export const updateUserSkillsSchema = z.object({
  body: z.object({
    skills: z
      .array(
        z.object({
          skillId: z.string().uuid("Invalid skill id"),
          level: z
            .enum(["beginner", "intermediate", "advanced"])
            .optional(),
        })
      )
      .max(30, "Maximum 30 skills allowed"),
  }),
});

export type UpdateUserSkillsBody = z.infer<
  typeof updateUserSkillsSchema
>["body"];