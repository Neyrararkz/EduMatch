import { db } from "../config/database.js";

export type ProjectRecord = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  status: string;
  deadline: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ProjectSkill = {
  id: string;
  name: string;
};

export type ProjectMember = {
  id: string;
  full_name: string;
  email: string;
  member_role: string;
};

export type ProjectDetails = ProjectRecord & {
  required_skills: ProjectSkill[];
  members: ProjectMember[];
};

export type CreateProjectInput = {
  creatorId: string;
  title: string;
  description: string;
  deadline?: string | undefined;
  requiredSkillIds?: string[] | undefined;
};

export type UpdateProjectInput = {
  projectId: string;
  title?: string | undefined;
  description?: string | undefined;
  status?: string | undefined;
  deadline?: string | undefined;
  requiredSkillIds?: string[] | undefined;
};

async function getProjectSkills(projectId: string): Promise<ProjectSkill[]> {
  const result = await db.query<ProjectSkill>(
    `
    SELECT s.id, s.name
    FROM project_required_skills prs
    JOIN skills s ON s.id = prs.skill_id
    WHERE prs.project_id = $1
    ORDER BY s.name ASC
    `,
    [projectId]
  );

  return result.rows;
}

async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const result = await db.query<ProjectMember>(
    `
    SELECT
      u.id,
      u.full_name,
      u.email,
      pm.member_role
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = $1
    ORDER BY pm.joined_at ASC
    `,
    [projectId]
  );

  return result.rows;
}

async function attachProjectDetails(
  project: ProjectRecord
): Promise<ProjectDetails> {
  const [requiredSkills, members] = await Promise.all([
    getProjectSkills(project.id),
    getProjectMembers(project.id),
  ]);

  return {
    ...project,
    required_skills: requiredSkills,
    members,
  };
}

export async function findAllProjects(): Promise<ProjectDetails[]> {
  const result = await db.query<ProjectRecord>(
    `
    SELECT
      id,
      creator_id,
      title,
      description,
      status,
      deadline,
      created_at,
      updated_at
    FROM projects
    ORDER BY created_at DESC
    `
  );

  return Promise.all(result.rows.map(attachProjectDetails));
}

export async function findProjectsByUserId(
  userId: string
): Promise<ProjectDetails[]> {
  const result = await db.query<ProjectRecord>(
    `
    SELECT DISTINCT
      p.id,
      p.creator_id,
      p.title,
      p.description,
      p.status,
      p.deadline,
      p.created_at,
      p.updated_at
    FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    WHERE p.creator_id = $1 OR pm.user_id = $1
    ORDER BY p.created_at DESC
    `,
    [userId]
  );

  return Promise.all(result.rows.map(attachProjectDetails));
}

export async function findProjectById(
  projectId: string
): Promise<ProjectDetails | null> {
  const result = await db.query<ProjectRecord>(
    `
    SELECT
      id,
      creator_id,
      title,
      description,
      status,
      deadline,
      created_at,
      updated_at
    FROM projects
    WHERE id = $1
    `,
    [projectId]
  );

  const project = result.rows[0];

  if (!project) {
    return null;
  }

  return attachProjectDetails(project);
}

export async function createProject(
  input: CreateProjectInput
): Promise<ProjectDetails> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const projectResult = await client.query<ProjectRecord>(
      `
      INSERT INTO projects (
        creator_id,
        title,
        description,
        deadline
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        creator_id,
        title,
        description,
        status,
        deadline,
        created_at,
        updated_at
      `,
      [
        input.creatorId,
        input.title,
        input.description,
        input.deadline ?? null,
      ]
    );

    const project = projectResult.rows[0];

    if (!project) {
      throw new Error("Failed to create project");
    }

    await client.query(
      `
      INSERT INTO project_members (
        project_id,
        user_id,
        member_role
      )
      VALUES ($1, $2, $3)
      `,
      [project.id, input.creatorId, "creator"]
    );

    await client.query(
      `
      INSERT INTO project_chats (project_id)
      VALUES ($1)
      `,
      [project.id]
    );

    if (input.requiredSkillIds && input.requiredSkillIds.length > 0) {
      for (const skillId of input.requiredSkillIds) {
        await client.query(
          `
          INSERT INTO project_required_skills (
            project_id,
            skill_id
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
          `,
          [project.id, skillId]
        );
      }
    }

    await client.query("COMMIT");

    const createdProject = await findProjectById(project.id);

    if (!createdProject) {
      throw new Error("Failed to load created project");
    }

    return createdProject;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateProjectById(
  input: UpdateProjectInput
): Promise<ProjectDetails | null> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<ProjectRecord>(
      `
      UPDATE projects
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        status = COALESCE($4, status),
        deadline = COALESCE($5, deadline),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        creator_id,
        title,
        description,
        status,
        deadline,
        created_at,
        updated_at
      `,
      [
        input.projectId,
        input.title ?? null,
        input.description ?? null,
        input.status ?? null,
        input.deadline ?? null,
      ]
    );

    const project = result.rows[0];

    if (!project) {
      await client.query("ROLLBACK");
      return null;
    }

    if (input.requiredSkillIds !== undefined) {
      await client.query(
        `
        DELETE FROM project_required_skills
        WHERE project_id = $1
        `,
        [input.projectId]
      );

      for (const skillId of input.requiredSkillIds) {
        await client.query(
          `
          INSERT INTO project_required_skills (
            project_id,
            skill_id
          )
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
          `,
          [input.projectId, skillId]
        );
      }
    }

    await client.query("COMMIT");

    return findProjectById(input.projectId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteProjectById(projectId: string): Promise<boolean> {
  const result = await db.query<{ id: string }>(
    `
    DELETE FROM projects
    WHERE id = $1
    RETURNING id
    `,
    [projectId]
  );

  return Boolean(result.rows[0]);
}