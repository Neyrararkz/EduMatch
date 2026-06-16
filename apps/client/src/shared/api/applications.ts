import { apiRequest } from "./client";
import type { ProjectApplication } from "../types/application";

export function submitApplication(
  projectId: string,
  message: string,
  token: string
) {
  return apiRequest<{ application: ProjectApplication }>(
    `/projects/${projectId}/applications`,
    {
      method: "POST",
      body: { message },
      token,
    }
  );
}

export function getMyApplications(token: string) {
  return apiRequest<{ applications: ProjectApplication[] }>("/applications/me", {
    token,
  });
}

export function getIncomingApplications(token: string) {
  return apiRequest<{ applications: ProjectApplication[] }>(
    "/applications/incoming",
    {
      token,
    }
  );
}

export function acceptApplication(applicationId: string, token: string) {
  return apiRequest<{ application: ProjectApplication }>(
    `/applications/${applicationId}/accept`,
    {
      method: "PATCH",
      token,
    }
  );
}

export function rejectApplication(applicationId: string, token: string) {
  return apiRequest<{ application: ProjectApplication }>(
    `/applications/${applicationId}/reject`,
    {
      method: "PATCH",
      token,
    }
  );
}