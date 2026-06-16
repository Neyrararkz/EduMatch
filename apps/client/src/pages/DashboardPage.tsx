import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthProvider";
import { getMyProjects } from "../shared/api/projects";
import type { Project } from "../shared/types/project";

export function DashboardPage() {
  const { user, accessToken } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMyProjects() {
      if (!accessToken) return;

      try {
        const response = await getMyProjects(accessToken);
        setProjects(response.projects);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Не удалось загрузить проекты");
      }
    }

    loadMyProjects();
  }, [accessToken]);

  return (
    <section>
      <h1>Личный кабинет</h1>

      {user && (
        <div>
          <h2>Привет, {user.full_name}</h2>
          <p>Email: {user.email}</p>
          <p>Университет: {user.university ?? "Не указан"}</p>
          <p>Курс: {user.course ?? "Не указан"}</p>
        </div>
      )}

      <div>
        <h2>Мои проекты</h2>

        <Link to="/projects/create">Создать новый проект</Link>

        {error && <p>{error}</p>}

        {projects.length === 0 ? (
          <p>У вас пока нет проектов.</p>
        ) : (
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <Link to={`/projects/${project.id}`}>{project.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}