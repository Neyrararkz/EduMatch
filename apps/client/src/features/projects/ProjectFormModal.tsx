import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "../../app/AuthProvider";
import { createProject, updateProject } from "../../shared/api/projects";
import { getSkills } from "../../shared/api/skills";
import type { Project } from "../../shared/types/project";
import type { Skill } from "../../shared/types/skill";

type ProjectFormModalProps = {
  project?: Project | null;
  onClose: () => void;
  onSuccess: (project: Project) => void;
};

export function ProjectFormModal({ project, onClose, onSuccess }: ProjectFormModalProps) {
  const { accessToken } = useAuth();

  const isEditing = Boolean(project);

  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [deadline, setDeadline] = useState(project?.deadline?.slice(0, 10) ?? "");
  const [status, setStatus] = useState<Project["status"]>(project?.status ?? "open");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    project?.required_skills.map((skill) => skill.id) ?? []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSkills() {
      if (!accessToken) return;

      try {
        const response = await getSkills(accessToken);
        setSkills(response.skills);
      } catch {
        setError("Не удалось загрузить навыки");
      }
    }

    loadSkills();
  }, [accessToken]);

  function toggleSkill(skillId: string) {
    setSelectedSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const input = {
        title,
        description,
        deadline: deadline || undefined,
        requiredSkillIds: selectedSkillIds,
      };

      const response =
        isEditing && project
          ? await updateProject(
              project.id,
              {
                ...input,
                status: status as "open" | "in_progress" | "completed" | "closed",
              },
              accessToken
            )
          : await createProject(input, accessToken);

      onSuccess(response.project);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось сохранить проект");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" type="button" onClick={onClose}>
          ← Назад
        </button>

        <h2>{isEditing ? "Редактировать проект" : "Создать проект"}</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Название проекта</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div>
            <label>Описание</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div>
            <label>Дедлайн</label>
            <input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>

          {isEditing && (
            <div>
              <label>Статус</label>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="open">Открыт</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Завершён</option>
                <option value="closed">Закрыт</option>
              </select>
            </div>
          )}

          <div>
            <label>Необходимые навыки</label>

            <div className="skills-grid">
              {skills.map((skill) => (
                <label key={skill.id} className="skill-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSkillIds.includes(skill.id)}
                    onChange={() => toggleSkill(skill.id)}
                  />
                  {skill.name}
                </label>
              ))}
            </div>
          </div>

          {error && <p>{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
                ? "Сохранение..."
                : isEditing
                ? "Сохранить изменения"
                : "Создать проект"}
            </button>
        </form>
      </div>
    </div>
  );
}