import {
  acceptApplicationById,
  createProjectApplication,
  findApplicationById,
  findApplicationByProjectAndApplicant,
  findIncomingApplications,
  findMyApplications,
  findProjectAccessById,
  isUserProjectMember,
  rejectApplicationById,
  type ApplicationRecord,
} from "../repositories/applications.repository.js";
import { AppError } from "../utils/app-error.js";
import type { CreateApplicationBody } from "../validators/application.validator.js";

export async function submitProjectApplication(
  projectId: string,
  applicantId: string,
  input: CreateApplicationBody
): Promise<ApplicationRecord> {
  const project = await findProjectAccessById(projectId);

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  if (project.creator_id === applicantId) {
    throw new AppError(400, "You cannot apply to your own project");
  }

  const isMember = await isUserProjectMember(projectId, applicantId);

  if (isMember) {
    throw new AppError(400, "You are already a project member");
  }

  const existingApplication = await findApplicationByProjectAndApplicant(
    projectId,
    applicantId
  );

  if (existingApplication) {
    throw new AppError(409, "Application already exists");
  }

  return createProjectApplication(projectId, applicantId, input.message);
}

export async function getMyProjectApplications(
  userId: string
): Promise<ApplicationRecord[]> {
  return findMyApplications(userId);
}

export async function getIncomingProjectApplications(
  userId: string
): Promise<ApplicationRecord[]> {
  return findIncomingApplications(userId);
}

export async function acceptProjectApplication(
  applicationId: string,
  ownerId: string
): Promise<ApplicationRecord> {
  const application = await findApplicationById(applicationId);

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  if (application.project_creator_id !== ownerId) {
    throw new AppError(403, "You can manage only applications to your projects");
  }

  if (application.status !== "pending") {
    throw new AppError(400, "Only pending applications can be accepted");
  }

  return acceptApplicationById(application);
}

export async function rejectProjectApplication(
  applicationId: string,
  ownerId: string
): Promise<ApplicationRecord> {
  const application = await findApplicationById(applicationId);

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  if (application.project_creator_id !== ownerId) {
    throw new AppError(403, "You can manage only applications to your projects");
  }

  if (application.status !== "pending") {
    throw new AppError(400, "Only pending applications can be rejected");
  }

  return rejectApplicationById(applicationId);
}