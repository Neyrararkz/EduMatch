import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider";
import { getMyApplications, submitApplication } from "../../shared/api/applications";
import { deleteProject } from "../../shared/api/projects";
import type { Project } from "../../shared/types/project";
import { UserAvatar } from "../../shared/ui/UserAvatar";
import { ProjectFormModal } from "./ProjectFormModal";
import { ProjectChat } from "./ProjectChat";
import {
  markProjectChatAsRead,
  requestNotificationsRefresh,
} from "../../shared/api/notifications";

type ProjectDetailsModalProps = {
  project: Project;
  onClose: () => void;
  onProjectUpdated: (project: Project) => void;
  onProjectDeleted: (projectId: string) => void;
};

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

function formatFileSize(size: number) {
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} КБ`;
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

export function ProjectDetailsModal({
  project,
  onClose,
  onProjectUpdated,
  onProjectDeleted,
}: ProjectDetailsModalProps) {
  const { accessToken, user } = useAuth();

  const [currentProject, setCurrentProject] = useState(project);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [isCheckingApplication, setIsCheckingApplication] = useState(false);
  const [error, setError] = useState("");

  const isCreator = Boolean(user && user.id === currentProject.creator_id);

  const isMember = Boolean(
    user && currentProject.members.some((member) => member.id === user.id)
  );

  useEffect(() => {
    if (!accessToken || (!isCreator && !isMember)) return;

    const token = accessToken;
    const projectId = currentProject.id;

    async function markAsRead() {
      try {
        await markProjectChatAsRead(projectId, token);
        requestNotificationsRefresh();
      } catch {
        return;
      }
    }

    markAsRead();

    const intervalId = window.setInterval(markAsRead, 8000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [accessToken, currentProject.id, isCreator, isMember]);

  useEffect(() => {
    setCurrentProject(project);
    setError("");
    setIsEditing(false);
    setHasExistingApplication(false);
  }, [project]);

  useEffect(() => {
    async function checkExistingApplication() {
      if (!accessToken || isCreator || isMember) return;

      setIsCheckingApplication(true);

      try {
        const response = await getMyApplications(accessToken);

        const exists = response.applications.some(
          (application) => application.project_id === currentProject.id
        );

        setHasExistingApplication(exists);
      } catch {
        setHasExistingApplication(false);
      } finally {
        setIsCheckingApplication(false);
      }
    }

    checkExistingApplication();
  }, [accessToken, currentProject.id, isCreator, isMember]);

  async function handleDelete() {
    if (!accessToken || !isCreator) return;

    const confirmed = confirm("Удалить этот проект?");
    if (!confirmed) return;

    setError("");
    setIsDeleting(true);

    try {
      await deleteProject(currentProject.id, accessToken);
      onProjectDeleted(currentProject.id);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось удалить проект");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSubmitApplication() {
    if (
      !accessToken ||
      isCreator ||
      isMember ||
      hasExistingApplication ||
      isSubmittingApplication
    ) {
      return;
    }

    const message = prompt("Напишите короткое сообщение владельцу проекта") ?? "";

    setError("");
    setIsSubmittingApplication(true);

    try {
      await submitApplication(currentProject.id, message, accessToken);
      setHasExistingApplication(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось отправить заявку";

      if (message === "Application already exists") {
        setHasExistingApplication(true);
        setError("");
        return;
      }

      setError(message);
    } finally {
      setIsSubmittingApplication(false);
    }
  }

  if (isEditing) {
    return (
      <ProjectFormModal
        project={currentProject}
        onClose={() => setIsEditing(false)}
        onSuccess={(updatedProject) => {
          setCurrentProject(updatedProject);
          onProjectUpdated(updatedProject);
        }}
      />
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>
          ← Назад
        </button>

        <h2>{currentProject.title}</h2>

        <p>{currentProject.description}</p>

        <div className="project-info">
          <p>Статус: {statusLabels[currentProject.status] ?? currentProject.status}</p>
          <p>Дедлайн: {formatDate(currentProject.deadline)}</p>
          <p>Создан: {formatDate(currentProject.created_at)}</p>
          <p>Участников: {currentProject.members.length}</p>
        </div>

        <section>
          <h3>Необходимые навыки</h3>

          {currentProject.required_skills.length === 0 ? (
            <p>Навыки не указаны.</p>
          ) : (
            <div className="skills-grid">
              {currentProject.required_skills.map((skill) => (
                <span className="skill-checkbox" key={skill.id}>
                  {skill.name}
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3>Файлы проекта</h3>

          {currentProject.files.length === 0 ? (
            <p>Файлы не прикреплены.</p>
          ) : (
            <div className="project-files-list">
              {currentProject.files.map((file) => (
                <a
                  className="project-file-link"
                  key={file.id}
                  href={file.file_data}
                  download={file.file_name}
                >
                  <span>{file.file_name}</span>
                  <span>{formatFileSize(file.file_size)}</span>
                </a>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3>Участники</h3>

          {currentProject.members.length === 0 ? (
            <p>Участников пока нет.</p>
          ) : (
            <ul>
              {currentProject.members.map((member) => (
                <li key={member.id}>
                  <Link
                    className="user-inline"
                    to={member.id === user?.id ? "/profile" : `/users/${member.id}`}
                    onClick={onClose}
                  >
                    <UserAvatar
                      src={member.avatar_url}
                      name={member.full_name}
                      size="sm"
                    />
                    <span>{member.full_name}</span>
                    <span>— {member.member_role}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {(isCreator || isMember) && <ProjectChat projectId={currentProject.id} />}

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          {isCreator && (
            <>
              <button type="button" onClick={() => setIsEditing(true)}>
                Редактировать
              </button>

              <button type="button" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Удаление..." : "Удалить"}
              </button>
            </>
          )}

          {!isCreator && !isMember && (
            <button
              type="button"
              onClick={handleSubmitApplication}
              disabled={
                isCheckingApplication ||
                isSubmittingApplication ||
                hasExistingApplication
              }
            >
              {isCheckingApplication
                ? "Проверка..."
                : hasExistingApplication
                  ? "Заявка уже отправлена"
                  : isSubmittingApplication
                    ? "Отправка..."
                    : "Подать заявку"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}