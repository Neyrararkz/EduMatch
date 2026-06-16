import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider";
import { submitApplication } from "../../shared/api/applications";
import { deleteProject } from "../../shared/api/projects";
import type { Project } from "../../shared/types/project";
import { UserAvatar } from "../../shared/ui/UserAvatar";
import { ProjectFormModal } from "./ProjectFormModal";

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
  const [applicationSent, setApplicationSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentProject(project);
    setApplicationSent(false);
    setError("");
    setIsEditing(false);
  }, [project]);

  const isCreator = Boolean(user && user.id === currentProject.creator_id);

  const isMember = Boolean(
    user && currentProject.members.some((member) => member.id === user.id)
  );

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
    if (!accessToken || isCreator || isMember || applicationSent) return;

    const message = prompt("Напишите короткое сообщение владельцу проекта") ?? "";

    setError("");
    setIsSubmittingApplication(true);

    try {
      await submitApplication(currentProject.id, message, accessToken);
      setApplicationSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось отправить заявку");
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
    <div className="modal-backdrop">
      <div className="modal">
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

        {error && <p>{error}</p>}

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
              disabled={isSubmittingApplication || applicationSent}
            >
              {applicationSent
                ? "Заявка отправлена"
                : isSubmittingApplication
                  ? "Отправка..."
                  : "Подать заявку"}
            </button>
          )}

          {!isCreator && isMember && <p>Вы участвуете в этом проекте.</p>}
        </div>
      </div>
    </div>
  );
}