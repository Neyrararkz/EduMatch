import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../app/AuthProvider";
import { ProjectDetailsModal } from "../features/projects/ProjectDetailsModal";
import { ProjectFormModal } from "../features/projects/ProjectFormModal";
import { getProjects } from "../shared/api/projects";
import type { Project } from "../shared/types/project";

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

export function ProjectsPage() {
  const { accessToken } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadProjects() {
    if (!accessToken) return;

    try {
      const response = await getProjects(accessToken);
      setProjects(response.projects);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось загрузить проекты");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, [accessToken]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "all" || project.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, status]);

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

  if (isLoading) {
    return <p>Загрузка проектов...</p>;
  }

  return (
    <section>
      <h1>Проекты</h1>

      <button type="button" onClick={() => setIsCreateOpen(true)}>
        Создать проект
      </button>

      <div>
        <input
          placeholder="Поиск по названию или описанию"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Все статусы</option>
          <option value="open">Открыт</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Завершён</option>
          <option value="closed">Закрыт</option>
        </select>
      </div>

      {error && <p>{error}</p>}

      {filteredProjects.length === 0 ? (
        <p>Проекты не найдены.</p>
      ) : (
        <div>
          {filteredProjects.map((project) => (
            <article key={project.id}>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <p>Статус: {statusLabels[project.status] ?? project.status}</p>
              <p>Дедлайн: {formatDate(project.deadline)}</p>
              <p>Участников: {project.members.length}</p>

              <button type="button" onClick={() => setSelectedProject(project)}>
                Открыть проект
              </button>
            </article>
          ))}
        </div>
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