import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../app/AuthProvider";
import { ProjectDetailsModal } from "../features/projects/ProjectDetailsModal";
import { ProjectFormModal } from "../features/projects/ProjectFormModal";
import {
  getNotificationsSummary,
  markProjectChatAsRead,
  requestNotificationsRefresh,
} from "../shared/api/notifications";
import { getProjects } from "../shared/api/projects";
import { getMySkills } from "../shared/api/skills";
import type { Project } from "../shared/types/project";
import type { UserSkill } from "../shared/types/skill";

const statusLabels: Record<string, string> = {
  open: "Открыт",
  in_progress: "В работе",
  completed: "Завершён",
  closed: "Закрыт",
};

function formatDate(date: string | null) {
  if (!date) return "Не указан";
  return new Date(date).toLocaleDateString("ru-RU");
}

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

function getProjectScore(project: Project, userSkills: UserSkill[]) {
  const userSkillIds = new Set(userSkills.map((skill) => skill.id));

  return project.required_skills.filter((skill) => userSkillIds.has(skill.id)).length;
}

export function ProjectsPage() {
  const { accessToken, user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);
  const [unreadByProject, setUnreadByProject] = useState<Record<string, number>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadProjects() {
    if (!accessToken) return;

    try {
      const [projectsResponse, skillsResponse] = await Promise.all([
        getProjects(accessToken),
        getMySkills(accessToken),
      ]);

      setProjects(projectsResponse.projects);
      setMySkills(skillsResponse.skills);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось загрузить проекты");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadNotificationSummary() {
    if (!accessToken) return;

    try {
      const response = await getNotificationsSummary(accessToken);

      const nextUnreadByProject = response.summary.unreadMessagesByProject.reduce<
        Record<string, number>
      >((acc, project) => {
        acc[project.project_id] = project.unread_count;
        return acc;
      }, {});

      setUnreadByProject(nextUnreadByProject);
    } catch {
      setUnreadByProject({});
    }
  }

  useEffect(() => {
    loadProjects();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    loadNotificationSummary();

    const intervalId = window.setInterval(loadNotificationSummary, 10000);

    window.addEventListener("edumatch-notifications-refresh", loadNotificationSummary);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(
        "edumatch-notifications-refresh",
        loadNotificationSummary
      );
    };
  }, [accessToken]);

  const searchableProjects = useMemo(() => {
    if (!user) return [];

    return projects.filter((project) => {
      const isCreator = project.creator_id === user.id;
      const isMember = project.members.some((member) => member.id === user.id);

      if (isCreator || isMember) {
        return false;
      }

      const normalizedSearch = search.toLowerCase().trim();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        project.title.toLowerCase().includes(normalizedSearch) ||
        project.description.toLowerCase().includes(normalizedSearch) ||
        project.required_skills.some((skill) =>
          skill.name.toLowerCase().includes(normalizedSearch)
        );

      const matchesStatus = status === "all" || project.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, status, user]);

  const recommendedProjects = useMemo(() => {
    return searchableProjects
      .filter((project) => getProjectScore(project, mySkills) > 0)
      .sort((a, b) => {
        const scoreDiff = getProjectScore(b, mySkills) - getProjectScore(a, mySkills);

        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [searchableProjects, mySkills]);

  const otherProjects = useMemo(() => {
    const recommendedIds = new Set(recommendedProjects.map((project) => project.id));

    return searchableProjects.filter((project) => !recommendedIds.has(project.id));
  }, [searchableProjects, recommendedProjects]);

  function handleProjectCreated(project: Project) {
    setProjects((currentProjects) => [project, ...currentProjects]);
  }

  function handleProjectUpdated(updatedProject: Project) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );

    setSelectedProject(updatedProject);
  }

  function handleProjectDeleted(projectId: string) {
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== projectId)
    );

    setSelectedProject(null);
  }

  async function handleProjectOpen(project: Project) {
    setSelectedProject(project);

    const canReadChat = Boolean(
      user &&
        (project.creator_id === user.id ||
          project.members.some((member) => member.id === user.id))
    );

    if (!accessToken || !canReadChat) return;

    const token = accessToken;

    setUnreadByProject((current) => ({
      ...current,
      [project.id]: 0,
    }));

    try {
      await markProjectChatAsRead(project.id, token);
      requestNotificationsRefresh();
    } catch {
      return;
    }
  }

  function renderProjectCard(project: Project) {
    const unreadCount = unreadByProject[project.id] ?? 0;
    const score = getProjectScore(project, mySkills);

    return (
      <button
        type="button"
        className="project-card"
        key={project.id}
        onClick={() => handleProjectOpen(project)}
      >
        <div className="project-card-header">
          <div className="project-card-title-row">
            <h2>{project.title}</h2>

            {unreadCount > 0 && (
              <span className="notification-badge project-card-badge">
                {formatBadgeCount(unreadCount)}
              </span>
            )}
          </div>

          <span className="project-status-badge">
            {statusLabels[project.status] ?? project.status}
          </span>
        </div>

        <p>{project.description}</p>

        <div className="project-card-meta">
          <span>Дедлайн: {formatDate(project.deadline)}</span>
          <span>Участников: {project.members.length}</span>

          {score > 0 && <span>Совпадений по навыкам: {score}</span>}
        </div>

        {project.required_skills.length > 0 && (
          <div className="skills-grid">
            {project.required_skills.map((skill) => (
              <span className="skill-checkbox" key={skill.id}>
                {skill.name}
              </span>
            ))}
          </div>
        )}
      </button>
    );
  }

  if (isLoading) {
    return <p>Загрузка проектов...</p>;
  }

  return (
    <section>
      <h1>Проекты</h1>

      <button type="button" onClick={() => setIsCreateOpen(true)}>
        + Создать проект
      </button>

      <div>
        <input
          placeholder="Поиск по названию, описанию или навыкам"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="pointer"
        >
          <option value="all">Все статусы</option>
          <option value="open">Открыт</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Завершён</option>
          <option value="closed">Закрыт</option>
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      {searchableProjects.length === 0 ? (
        <p>Подходящие проекты не найдены.</p>
      ) : (
        <>
          {recommendedProjects.length > 0 && (
            <section className="projects-section">
              <h2>Рекомендуемые проекты</h2>
              <div>{recommendedProjects.map((project) => renderProjectCard(project))}</div>
            </section>
          )}

          {otherProjects.length > 0 && (
            <section className="projects-section">
              <h2>Остальные проекты</h2>
              <div>{otherProjects.map((project) => renderProjectCard(project))}</div>
            </section>
          )}
        </>
      )}

      {isCreateOpen && (
        <ProjectFormModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={handleProjectCreated}
        />
      )}

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onProjectUpdated={handleProjectUpdated}
          onProjectDeleted={handleProjectDeleted}
        />
      )}
    </section>
  );
}