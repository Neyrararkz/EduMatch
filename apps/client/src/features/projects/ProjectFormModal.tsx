import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "../../app/AuthProvider";
import { createProject, updateProject } from "../../shared/api/projects";
import { getSkills } from "../../shared/api/skills";
import type { Project, ProjectFileInput } from "../../shared/types/project";
import type { Skill } from "../../shared/types/skill";

type ProjectFormModalProps = {
  project?: Project | null;
  onClose: () => void;
  onSuccess: (project: Project) => void;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Не удалось прочитать файл"));
    };

    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} КБ`;
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

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
  const [files, setFiles] = useState<ProjectFileInput[]>([]);
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

  async function handleFilesChange(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    const nextFiles = Array.from(selectedFiles);

    if (nextFiles.length > 3) {
      setError("Можно загрузить не больше 3 файлов");
      return;
    }

    const tooLargeFile = nextFiles.find((file) => file.size > 2 * 1024 * 1024);

    if (tooLargeFile) {
      setError("Размер одного файла не должен превышать 2 МБ");
      return;
    }

    try {
      const preparedFiles = await Promise.all(
        nextFiles.map(async (file) => ({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
          fileData: await fileToDataUrl(file),
        }))
      );

      setFiles(preparedFiles);
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось загрузить файлы");
    }
  }

  function removeFile(fileName: string) {
    setFiles((current) => current.filter((file) => file.fileName !== fileName));
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
          : await createProject(
              {
                ...input,
                files,
              },
              accessToken
            );

      onSuccess(response.project);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось сохранить проект");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
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

          {!isEditing && (
            <div>
              <label>Файлы проекта</label>

              <input
                type="file"
                multiple
                onChange={(event) => handleFilesChange(event.target.files)}
              />

              {files.length > 0 && (
                <div className="project-files-list">
                  {files.map((file) => (
                    <div className="project-file-item" key={file.fileName}>
                      <span>
                        {file.fileName} · {formatFileSize(file.fileSize)}
                      </span>

                      <button type="button" onClick={() => removeFile(file.fileName)}>
                        Убрать
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

          {error && <p className="form-error">{error}</p>}

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