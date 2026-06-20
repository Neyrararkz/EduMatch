export type ProjectSkill = {
  id: string;
  name: string;
};

export type ProjectMember = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  member_role: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_data: string;
  created_at: string;
};

export type ProjectFileInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
};

export type Project = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  required_skills: ProjectSkill[];
  members: ProjectMember[];
  files: ProjectFile[];
};

export type CreateProjectInput = {
  title: string;
  description: string;
  deadline?: string;
  requiredSkillIds?: string[];
  files?: ProjectFileInput[];
};

export type UpdateProjectInput = {
  title?: string;
  description?: string;
  status?: "open" | "in_progress" | "completed" | "closed";
  deadline?: string;
  requiredSkillIds?: string[];
};