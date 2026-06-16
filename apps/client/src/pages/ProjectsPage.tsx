import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthProvider";
import { getProjects } from "../shared/api/projects";
import type { Project } from "../shared/types/project";

export function ProjectsPage() {
  const { accessToken } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  if (isLoading) {
    return <p>Загрузка проектов...</p>;
  }

  return (
    <section>
      <h1>Проекты</h1>

      <Link to="/projects/create">Создать проект</Link>

      <div>
        <input
          placeholder="Поиск по названию или описанию"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Все статусы</option>
          <option value="open">Открыт</option>
          <option value="in_progress">В процессе</option>
          <option value="completed">Завершен</option>
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
              <p>Статус: {project.status}</p>
              <p>Срок выполнения: {project.deadline ?? "Не указан"}</p>
              <p>Участники: {project.members.length}</p>

              <Link to={`/projects/${project.id}`}>Открыть проект</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}