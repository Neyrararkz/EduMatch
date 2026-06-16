import { db } from "../config/database.js";

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export type ApplicationRecord = {
  id: string;
  project_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: Date;
  updated_at: Date;

  project_title?: string;
  project_creator_id?: string;
  applicant_full_name?: string;
  applicant_email?: string;
};

export type ProjectAccessRecord = {
  id: string;
  creator_id: string;
};

export async function findProjectAccessById(
  projectId: string
): Promise<ProjectAccessRecord | null> {
  const result = await db.query<ProjectAccessRecord>(
    `
    SELECT id, creator_id
    FROM projects
    WHERE id = $1
    `,
    [projectId]
  );

  return result.rows[0] ?? null;
}

export async function isUserProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  const result = await db.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM project_members
      WHERE project_id = $1 AND user_id = $2
    )
    `,
    [projectId, userId]
  );

  return Boolean(result.rows[0]?.exists);
}

export async function findApplicationByProjectAndApplicant(
  projectId: string,
  applicantId: string
): Promise<ApplicationRecord | null> {
  const result = await db.query<ApplicationRecord>(
    `
    SELECT
      id,
      project_id,
      applicant_id,
      status,
      message,
      created_at,
      updated_at
    FROM project_applications
    WHERE project_id = $1 AND applicant_id = $2
    `,
    [projectId, applicantId]
  );

  return result.rows[0] ?? null;
}

export async function createProjectApplication(
  projectId: string,
  applicantId: string,
  message?: string
): Promise<ApplicationRecord> {
  const result = await db.query<ApplicationRecord>(
    `
    INSERT INTO project_applications (
      project_id,
      applicant_id,
      message
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      project_id,
      applicant_id,
      status,
      message,
      created_at,
      updated_at
    `,
    [projectId, applicantId, message ?? null]
  );

  const application = result.rows[0];

  if (!application) {
    throw new Error("Failed to create application");
  }

  return application;
}

export async function findMyApplications(
  userId: string
): Promise<ApplicationRecord[]> {
  const result = await db.query<ApplicationRecord>(
    `
    SELECT
      pa.id,
      pa.project_id,
      pa.applicant_id,
      pa.status,
      pa.message,
      pa.created_at,
      pa.updated_at,
      p.title AS project_title,
      p.creator_id AS project_creator_id
    FROM project_applications pa
    JOIN projects p ON p.id = pa.project_id
    WHERE pa.applicant_id = $1
    ORDER BY pa.created_at DESC
    `,
    [userId]
  );

  return result.rows;
}

export async function findIncomingApplications(
  ownerId: string
): Promise<ApplicationRecord[]> {
  const result = await db.query<ApplicationRecord>(
    `
    SELECT
      pa.id,
      pa.project_id,
      pa.applicant_id,
      pa.status,
      pa.message,
      pa.created_at,
      pa.updated_at,
      p.title AS project_title,
      p.creator_id AS project_creator_id,
      u.full_name AS applicant_full_name,
      u.email AS applicant_email
    FROM project_applications pa
    JOIN projects p ON p.id = pa.project_id
    JOIN users u ON u.id = pa.applicant_id
    WHERE p.creator_id = $1
    ORDER BY pa.created_at DESC
    `,
    [ownerId]
  );

  return result.rows;
}

export async function findApplicationById(
  applicationId: string
): Promise<ApplicationRecord | null> {
  const result = await db.query<ApplicationRecord>(
    `
    SELECT
      pa.id,
      pa.project_id,
      pa.applicant_id,
      pa.status,
      pa.message,
      pa.created_at,
      pa.updated_at,
      p.title AS project_title,
      p.creator_id AS project_creator_id,
      u.full_name AS applicant_full_name,
      u.email AS applicant_email
    FROM project_applications pa
    JOIN projects p ON p.id = pa.project_id
    JOIN users u ON u.id = pa.applicant_id
    WHERE pa.id = $1
    `,
    [applicationId]
  );

  return result.rows[0] ?? null;
}

export async function acceptApplicationById(
  application: ApplicationRecord
): Promise<ApplicationRecord> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const updateResult = await client.query<ApplicationRecord>(
      `
      UPDATE project_applications
      SET status = 'accepted', updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        project_id,
        applicant_id,
        status,
        message,
        created_at,
        updated_at
      `,
      [application.id]
    );

    await client.query(
      `
      INSERT INTO project_members (
        project_id,
        user_id,
        member_role
      )
      VALUES ($1, $2, 'member')
      ON CONFLICT (project_id, user_id) DO NOTHING
      `,
      [application.project_id, application.applicant_id]
    );

    await client.query("COMMIT");

    const updatedApplication = updateResult.rows[0];

    if (!updatedApplication) {
      throw new Error("Failed to accept application");
    }

    return updatedApplication;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function rejectApplicationById(
  applicationId: string
): Promise<ApplicationRecord> {
  const result = await db.query<ApplicationRecord>(
    `
    UPDATE project_applications
    SET status = 'rejected', updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      project_id,
      applicant_id,
      status,
      message,
      created_at,
      updated_at
    `,
    [applicationId]
  );

  const application = result.rows[0];

  if (!application) {
    throw new Error("Failed to reject application");
  }

  return application;
}