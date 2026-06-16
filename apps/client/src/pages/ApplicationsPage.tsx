import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthProvider";
import { ProjectDetailsModal } from "../features/projects/ProjectDetailsModal";
import {
  acceptApplication,
  getIncomingApplications,
  getMyApplications,
  rejectApplication,
} from "../shared/api/applications";
import { getProjectById } from "../shared/api/projects";
import type { ProjectApplication } from "../shared/types/application";
import type { Project } from "../shared/types/project";
import { UserAvatar } from "../shared/ui/UserAvatar";

export function ApplicationsPage() {
  const { accessToken } = useAuth();

  const [myApplications, setMyApplications] = useState<ProjectApplication[]>([]);
  const [incomingApplications, setIncomingApplications] = useState<ProjectApplication[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const pendingIncomingApplications = useMemo(() => {
    return incomingApplications.filter((application) => application.status === "pending");
  }, [incomingApplications]);

  async function loadApplications() {
    if (!accessToken) return;

    setError("");

    try {
      const [myResponse, incomingResponse] = await Promise.all([
        getMyApplications(accessToken),
        getIncomingApplications(accessToken),
      ]);

      setMyApplications(myResponse.applications);
      setIncomingApplications(incomingResponse.applications);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось загрузить заявки");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, [accessToken]);

  async function openProject(projectId: string) {
    if (!accessToken) return;

    setError("");

    try {
      const response = await getProjectById(projectId, accessToken);
      setSelectedProject(response.project);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось открыть проект");
    }
  }

  async function handleAccept(applicationId: string) {
    if (!accessToken) return;

    try {
      await acceptApplication(applicationId, accessToken);

      setIncomingApplications((currentApplications) =>
        currentApplications.filter((application) => application.id !== applicationId)
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось принять заявку");
    }
  }

  async function handleReject(applicationId: string) {
    if (!accessToken) return;

    try {
      await rejectApplication(applicationId, accessToken);

      setIncomingApplications((currentApplications) =>
        currentApplications.filter((application) => application.id !== applicationId)
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось отклонить заявку");
    }
  }

  function handleProjectUpdated(updatedProject: Project) {
    setSelectedProject(updatedProject);
  }

  function handleProjectDeleted(projectId: string) {
    setSelectedProject(null);

    setMyApplications((currentApplications) =>
      currentApplications.filter((application) => application.project_id !== projectId)
    );

    setIncomingApplications((currentApplications) =>
      currentApplications.filter((application) => application.project_id !== projectId)
    );
  }

  if (isLoading) {
    return <p>Загрузка заявок...</p>;
  }

  return (
    <section>
      <h1>Заявки</h1>

      {error && <p>{error}</p>}

      <section>
        <h2>Мои заявки</h2>

        {myApplications.length === 0 ? (
          <p>Вы пока не подавали заявки.</p>
        ) : (
          <div>
            {myApplications.map((application) => (
              <article key={application.id}>
                <h3>
                  <button
                    type="button"
                    onClick={() => openProject(application.project_id)}
                  >
                    {application.project_title ?? "Проект"}
                  </button>
                </h3>

                <p>Сообщение: {application.message || "Без сообщения"}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Заявки в мои проекты</h2>

        {pendingIncomingApplications.length === 0 ? (
          <p>Входящих заявок пока нет.</p>
        ) : (
          <div>
            {pendingIncomingApplications.map((application) => (
              <article key={application.id}>
                <div className="application-header">
                  <Link
                    className="user-inline"
                    to={`/users/${application.applicant_id}`}
                  >
                    <UserAvatar
                      src={application.applicant_avatar_url}
                      name={application.applicant_full_name}
                      size="sm"
                    />
                    <strong>{application.applicant_full_name ?? "Пользователь"}</strong>
                  </Link>
                </div>

                <div className="application-meta">
                  <p>
                    Проект:{" "}
                    <button
                      type="button"
                      onClick={() => openProject(application.project_id)}
                    >
                      {application.project_title ?? "Открыть проект"}
                    </button>
                  </p>

                  <p>Сообщение: {application.message || "Без сообщения"}</p>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => handleAccept(application.id)}>
                    Принять
                  </button>

                  <button type="button" onClick={() => handleReject(application.id)}>
                    Отклонить
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

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