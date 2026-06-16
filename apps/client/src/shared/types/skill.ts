export type Skill = {
  id: string;
  name: string;
  created_at: string;
};

export type UserSkill = {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
};

export type UpdateUserSkillInput = {
  skillId: string;
  level?: "beginner" | "intermediate" | "advanced";
};