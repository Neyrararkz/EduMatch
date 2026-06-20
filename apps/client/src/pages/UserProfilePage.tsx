import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "../app/AuthProvider";
import { ProjectDetailsModal } from "../features/projects/ProjectDetailsModal";
import {
  getNotificationsSummary,
  markProjectChatAsRead,
  requestNotificationsRefresh,
} from "../shared/api/notifications";
import { getProjects } from "../shared/api/projects";
import { getMySkills, getSkills, getUserSkills, updateMySkills } from "../shared/api/skills";
import { getUserById, updateMe, type UpdateProfileInput } from "../shared/api/users";
import type { User } from "../shared/types/auth";
import type { Project } from "../shared/types/project";
import type { Skill, UpdateUserSkillInput, UserSkill } from "../shared/types/skill";
import { UserAvatar } from "../shared/ui/UserAvatar";

const skillLevelLabels = {
  beginner: "Начальный",
  intermediate: "Средний",
  advanced: "Продвинутый",
} as const;

const statusLabels: Record<string, string> = {
  open: "Открыт",
  in_progress: "В работе",
  completed: "Завершён",
  closed: "Закрыт",
};

function formatDate(date: string | null) {
  if (!date) return "Без дедлайна";
  return new Date(date).toLocaleDateString("ru-RU");
}

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

function getMainSkill(project: Project) {
  return project.required_skills[0]?.name ?? "Без навыков";
}

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

export function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser, accessToken } = useAuth();

  const isMyProfile = !id || id === currentUser?.id;
  const profileUserId = id ?? currentUser?.id;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [unreadByProject, setUnreadByProject] = useState<Record<string, number>>({});

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [about, setAbout] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!accessToken || !profileUserId) return;

      setIsLoading(true);
      setError("");

      try {
        const [profileResponse, skillsResponse, allSkillsResponse, projectsResponse] =
          await Promise.all([
            isMyProfile
              ? Promise.resolve({ user: currentUser as User })
              : getUserById(profileUserId, accessToken),
            isMyProfile
              ? getMySkills(accessToken)
              : getUserSkills(profileUserId, accessToken),
            getSkills(accessToken),
            getProjects(accessToken),
          ]);

        setProfileUser(profileResponse.user);
        setSkills(skillsResponse.skills);
        setAllSkills(allSkillsResponse.skills);
        setProjects(projectsResponse.projects);

        setFullName(profileResponse.user.full_name);
        setAvatarUrl(profileResponse.user.avatar_url ?? "");
        setAbout(profileResponse.user.about ?? "");
        setUniversity(profileResponse.user.university ?? "");
        setCourse(profileResponse.user.course ? String(profileResponse.user.course) : "");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Не удалось загрузить профиль");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [accessToken, currentUser, isMyProfile, profileUserId]);

  useEffect(() => {
    if (!accessToken) {
      setUnreadByProject({});
      return;
    }

    const token = accessToken;
    let isMounted = true;

    async function loadNotificationSummary() {
      try {
        const response = await getNotificationsSummary(token);

        const nextUnreadByProject = response.summary.unreadMessagesByProject.reduce<
          Record<string, number>
        >((acc, project) => {
          acc[project.project_id] = project.unread_count;
          return acc;
        }, {});

        if (isMounted) {
          setUnreadByProject(nextUnreadByProject);
        }
      } catch {
        if (isMounted) {
          setUnreadByProject({});
        }
      }
    }

    function handleRefresh() {
      void loadNotificationSummary();
    }

    void loadNotificationSummary();

    const intervalId = window.setInterval(handleRefresh, 10000);

    window.addEventListener("edumatch-notifications-refresh", handleRefresh);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("edumatch-notifications-refresh", handleRefresh);
    };
  }, [accessToken]);

  const createdProjects = useMemo(() => {
    if (!profileUserId) return [];

    return projects.filter((project) => project.creator_id === profileUserId);
  }, [projects, profileUserId]);

  const participatingProjects = useMemo(() => {
    if (!profileUserId) return [];

    return projects.filter((project) => {
      const isCreator = project.creator_id === profileUserId;
      const isMember = project.members.some((member) => member.id === profileUserId);

      return isMember && !isCreator;
    });
  }, [projects, profileUserId]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) return;

    setError("");

    const input: UpdateProfileInput = {
      fullName,
    };

    if (avatarUrl) input.avatarUrl = avatarUrl;
    if (about) input.about = about;
    if (university) input.university = university;
    if (course) input.course = Number(course);

    try {
      const response = await updateMe(input, accessToken);
      setProfileUser(response.user);
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось обновить профиль");
    }
  }

  async function handleAvatarFileChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Можно загрузить только изображение");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Размер изображения не должен превышать 2 МБ");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось загрузить аватар");
    }
  }

  async function handleSkillToggle(skillId: string) {
    if (!accessToken || !isMyProfile) return;

    const exists = skills.some((skill) => skill.id === skillId);

    const nextSkills: UpdateUserSkillInput[] = exists
      ? skills
          .filter((skill) => skill.id !== skillId)
          .map((skill) => ({
            skillId: skill.id,
            level: skill.level,
          }))
      : [
          ...skills.map((skill) => ({
            skillId: skill.id,
            level: skill.level,
          })),
          {
            skillId,
            level: "beginner",
          },
        ];

    try {
      const response = await updateMySkills(nextSkills, accessToken);
      setSkills(response.skills);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось обновить навыки");
    }
  }

  async function handleSkillLevelChange(
    skillId: string,
    level: "beginner" | "intermediate" | "advanced"
  ) {
    if (!accessToken || !isMyProfile) return;

    const nextSkills: UpdateUserSkillInput[] = skills.map((skill) => ({
      skillId: skill.id,
      level: skill.id === skillId ? level : skill.level,
    }));

    try {
      const response = await updateMySkills(nextSkills, accessToken);
      setSkills(response.skills);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось обновить уровень навыка");
    }
  }

  async function handleProjectOpen(project: Project) {
    setSelectedProject(project);

    const canReadChat = Boolean(
      currentUser &&
        (project.creator_id === currentUser.id ||
          project.members.some((member) => member.id === currentUser.id))
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

  function renderProjectCard(project: Project) {
    const unreadCount = unreadByProject[project.id] ?? 0;

    return (
      <button
        type="button"
        className="profile-project-card"
        onClick={() => handleProjectOpen(project)}
        key={project.id}
      >
        <div className="profile-project-card-header">
          <div className="project-card-title-row">
            <h3>{project.title}</h3>

            {unreadCount > 0 && (
              <span className="notification-badge profile-project-notification-badge">
                {formatBadgeCount(unreadCount)}
              </span>
            )}
          </div>

          <span>{statusLabels[project.status] ?? project.status}</span>
        </div>

        <p>{project.description}</p>

        <div className="profile-project-card-footer">
          <span className="language-dot" />
          <span>{getMainSkill(project)}</span>
          <span>{formatDate(project.deadline)}</span>
        </div>
      </button>
    );
  }

  if (isLoading) {
    return <p>Загрузка профиля...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!profileUser) {
    return <p>Пользователь не найден.</p>;
  }

  return (
    <section className="profile-page">
      <div className="profile-layout">
        <aside className="profile-sidebar-card">
          <UserAvatar src={profileUser.avatar_url} name={profileUser.full_name} size="lg" />

          {!isEditing ? (
            <>
              <h1>{profileUser.full_name}</h1>
              <p>{profileUser.email}</p>

              <div className="profile-facts">
                <p>Учебное заведение: {profileUser.university ?? "Не указано"}</p>
                <p>Курс: {profileUser.course ?? "Не указан"}</p>
              </div>

              <div>
                <h3>О себе</h3>
                <p>
                  {profileUser.about ??
                    (isMyProfile
                      ? "Вы пока ничего не рассказали о себе."
                      : "Пользователь пока ничего не рассказал о себе.")}
                </p>
              </div>

              {isMyProfile && (
                <button type="button" onClick={() => setIsEditing(true)}>
                  Редактировать профиль
                </button>
              )}
            </>
          ) : (
            <form onSubmit={handleProfileSubmit}>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleAvatarFileChange(event.target.files?.[0] ?? null)}
                />

                {avatarUrl && (
                  <button type="button" onClick={() => setAvatarUrl("")}>
                    Удалить аватар
                  </button>
                )}
              </div>

              <div>
                <label>Имя</label>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>

              <div>
                <label>Учебное заведение</label>
                <input
                  value={university}
                  onChange={(event) => setUniversity(event.target.value)}
                />
              </div>

              <div>
                <label>Курс</label>
                <input
                  type="number"
                  min="1"
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                />
              </div>

              <div>
                <label>О себе</label>
                <textarea value={about} onChange={(event) => setAbout(event.target.value)} />
              </div>

              <button type="submit">Сохранить</button>

              <button type="button" onClick={() => setIsEditing(false)}>
                Отмена
              </button>
            </form>
          )}
        </aside>

        <div className="profile-main">
          <section className="profile-section-card">
            <h2>Навыки</h2>

            {skills.length === 0 ? (
              <p>{isMyProfile ? "Вы пока не указали навыки." : "Навыки пока не указаны."}</p>
            ) : (
              <div className="skills-grid">
                {skills.map((skill) => (
                  <div className="profile-skill-chip" key={skill.id}>
                    <span>{skill.name} — {skillLevelLabels[skill.level]}</span>

                    {isMyProfile && isEditing && (
                      <select
                        value={skill.level}
                        onChange={(event) =>
                          handleSkillLevelChange(
                            skill.id,
                            event.target.value as "beginner" | "intermediate" | "advanced"
                          )
                        }
                      >
                        <option value="beginner">Начальный</option>
                        <option value="intermediate">Средний</option>
                        <option value="advanced">Продвинутый</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isMyProfile && isEditing && (
              <div className="profile-all-skills">
                <h3>Добавить или убрать навыки</h3>

                <div className="skills-grid">
                  {allSkills.map((skill) => {
                    const checked = skills.some((userSkill) => userSkill.id === skill.id);

                    return (
                      <label key={skill.id} className="skill-checkbox">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleSkillToggle(skill.id)}
                        />
                        {skill.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="profile-section-card">
            <h2>{isMyProfile ? "Ваши проекты" : "Проекты пользователя"}</h2>

            <div className="profile-project-group">
              <h3>{isMyProfile ? "Созданные вами проекты" : "Созданные проекты"}</h3>

              {createdProjects.length === 0 ? (
                <p>
                  {isMyProfile
                    ? "Вы пока не создали проектов."
                    : "Пользователь пока не создал проектов."}
                </p>
              ) : (
                <div className="profile-project-grid">
                  {createdProjects.map((project) => renderProjectCard(project))}
                </div>
              )}
            </div>

            <div className="profile-project-group">
              <h3>
                {isMyProfile ? "Вы участвуете в проектах" : "Участвует в проектах"}
              </h3>

              {participatingProjects.length === 0 ? (
                <p>
                  {isMyProfile
                    ? "Вы пока не участвуете в проектах."
                    : "Пользователь пока не участвует в проектах."}
                </p>
              ) : (
                <div className="profile-project-grid">
                  {participatingProjects.map((project) => renderProjectCard(project))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

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