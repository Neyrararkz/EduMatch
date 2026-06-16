import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthProvider";
import { getProjects } from "../shared/api/projects";
import { getMySkills, getSkills, getUserSkills, updateMySkills } from "../shared/api/skills";
import { getUserById, updateMe } from "../shared/api/users";
import type { User } from "../shared/types/auth";
import type { Project } from "../shared/types/project";
import type { Skill, UpdateUserSkillInput, UserSkill } from "../shared/types/skill";
import { ProjectDetailsModal } from "../features/projects/ProjectDetailsModal";
import { UserAvatar } from "../shared/ui/UserAvatar";

const skillLevelLabels = {
  beginner: "Начальный",
  intermediate: "Средний",
  advanced: "Продвинутый",
} as const;

export function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser, accessToken } = useAuth();

  const isMyProfile = !id || id === currentUser?.id;
  const profileUserId = id ?? currentUser?.id;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [about, setAbout] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

    const input = {
      fullName,
      avatarUrl: avatarUrl || undefined,
      about: about || undefined,
      university: university || undefined,
      course: course ? Number(course) : undefined,
    };

    try {
      const response = await updateMe(input, accessToken);
      setProfileUser(response.user);
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось обновить профиль");
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
    return <p>Загрузка профиля...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!profileUser) {
    return <p>Пользователь не найден.</p>;
  }

  return (
    <section>
      <h1>{isMyProfile ? "Мой профиль" : `Профиль: ${profileUser.full_name}`}</h1>

      <section>
        <UserAvatar src={profileUser.avatar_url} name={profileUser.full_name} size="lg" />

        {!isEditing ? (
          <div>
            <h2>{profileUser.full_name}</h2>
            <p>Email: {profileUser.email}</p>
            <p>Учебное заведение: {profileUser.university ?? "Не указано"}</p>
            <p>Курс: {profileUser.course ?? "Не указан"}</p>
            <p>Рейтинг: {profileUser.rating ?? "0"}</p>

            <h3>О себе</h3>
            <p>{profileUser.about ?? "Пользователь пока ничего не рассказал о себе."}</p>

            {isMyProfile && (
              <button type="button" onClick={() => setIsEditing(true)}>
                Редактировать профиль
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit}>
            <div>
              <label>Имя</label>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>

            <div>
              <label>Ссылка на аватар</label>
              <input
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
              />
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
      </section>

      <section>
        <h2>Навыки</h2>

        {skills.length === 0 ? (
          <p>Навыки пока не указаны.</p>
        ) : (
          <ul>
            {skills.map((skill) => (
              <li key={skill.id}>
                {skill.name} — {skillLevelLabels[skill.level]}

                {isMyProfile && (
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
              </li>
            ))}
          </ul>
        )}

        {isMyProfile && (
          <div>
            <h3>Добавить или убрать навыки</h3>

            {allSkills.map((skill) => {
              const checked = skills.some((userSkill) => userSkill.id === skill.id);

              return (
                <label key={skill.id}>
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
        )}
      </section>

      <section>
        <h2>Проекты пользователя</h2>

        <h3>Созданные проекты</h3>

        {createdProjects.length === 0 ? (
          <p>Пользователь пока не создал проектов.</p>
        ) : (
          <ul>
            {createdProjects.map((project) => (
              <li key={project.id}>
                <button type="button" onClick={() => setSelectedProject(project)}>
                  {project.title}
                </button>
              </li>
            ))}
          </ul>
        )}

        <h3>Участвует в проектах</h3>

        {participatingProjects.length === 0 ? (
          <p>Пользователь пока не участвует в проектах.</p>
        ) : (
          <ul>
            {participatingProjects.map((project) => (
              <li key={project.id}>
                <button type="button" onClick={() => setSelectedProject(project)}>
                  {project.title}
                </button>
              </li>
            ))}
          </ul>
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