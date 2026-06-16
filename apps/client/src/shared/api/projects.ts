import { apiRequest } from "./client";
import type { CreateProjectInput, Project } from "../types/project";

export function getProjects(token: string) {
  return apiRequest<{ projects: Project[] }>("/projects", {
    token,
  });
}

export function getMyProjects(token: string) {
  return apiRequest<{ projects: Project[] }>("/projects/my", {
    token,
  });
}

export function getProjectById(projectId: string, token: string) {
  return apiRequest<{ project: Project }>(`/projects/${projectId}`, {
    token,
  });
}

export function createProject(input: CreateProjectInput, token: string) {
  return apiRequest<{ project: Project }>("/projects", {
    method: "POST",
    body: input,
    token,
  });
}

export function deleteProject(projectId: string, token: string) {
  return apiRequest<{ message: string }>(`/projects/${projectId}`, {
    method: "DELETE",
    token,
  });
}