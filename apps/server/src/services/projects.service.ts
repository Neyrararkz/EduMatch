import {
  createProject,
  deleteProjectById,
  findAllProjects,
  findProjectById,
  findProjectsByUserId,
  updateProjectById,
  type ProjectDetails,
} from "../repositories/projects.repository.js";
import { AppError } from "../utils/app-error.js";
import {
  type CreateProjectBody,
  type UpdateProjectBody,
} from "../validators/project.validator.js";

export async function getProjects(): Promise<ProjectDetails[]> {
  return findAllProjects();
}

export async function getMyProjects(userId: string): Promise<ProjectDetails[]> {
  return findProjectsByUserId(userId);
}

export async function getProject(projectId: string): Promise<ProjectDetails> {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  return project;
}

export async function createProjectForUser(
  userId: string,
  input: CreateProjectBody
): Promise<ProjectDetails> {
  return createProject({
    creatorId: userId,
    title: input.title,
    description: input.description,
    deadline: input.deadline,
    requiredSkillIds: input.requiredSkillIds,
  });
}

export async function updateProjectForUser(
  projectId: string,
  userId: string,
  input: UpdateProjectBody
): Promise<ProjectDetails> {
  const project = await getProject(projectId);

  if (project.creator_id !== userId) {
    throw new AppError(403, "Only project creator can update this project");
  }

  const updatedProject = await updateProjectById({
    projectId,
    title: input.title,
    description: input.description,
    status: input.status,
    deadline: input.deadline,
    requiredSkillIds: input.requiredSkillIds,
  });

  if (!updatedProject) {
    throw new AppError(404, "Project not found");
  }

  return updatedProject;
}

export async function deleteProjectForUser(
  projectId: string,
  userId: string
): Promise<void> {
  const project = await getProject(projectId);

  if (project.creator_id !== userId) {
    throw new AppError(403, "Only project creator can delete this project");
  }

  const deleted = await deleteProjectById(projectId);

  if (!deleted) {
    throw new AppError(404, "Project not found");
  }
}