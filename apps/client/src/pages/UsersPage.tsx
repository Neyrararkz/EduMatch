import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthProvider";
import { getUserSkills } from "../shared/api/skills";
import { getUsers } from "../shared/api/users";
import type { User } from "../shared/types/auth";
import type { UserSkill } from "../shared/types/skill";
import { UserAvatar } from "../shared/ui/UserAvatar";

type UserWithSkills = User & {
  skills: UserSkill[];
};

const skillLevelLabels: Record<string, string> = {
  beginner: "Начальный",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

export function UsersPage() {
  const { accessToken, user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserWithSkills[]>([]);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      if (!accessToken) return;

      setError("");
      setIsLoading(true);

      try {
        const usersResponse = await getUsers(accessToken);

        const usersWithSkills = await Promise.all(
          usersResponse.users.map(async (user) => {
            const skillsResponse = await getUserSkills(user.id, accessToken);

            return {
              ...user,
              skills: skillsResponse.skills,
            };
          })
        );

        setUsers(usersWithSkills);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Не удалось загрузить пользователей");
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, [accessToken]);

  const allSkillNames = useMemo(() => {
    const names = users.flatMap((user) => user.skills.map((skill) => skill.name));
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return users.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.university?.toLowerCase().includes(normalizedSearch) ||
        user.about?.toLowerCase().includes(normalizedSearch);

      const matchesSkill =
        skillFilter === "all" ||
        user.skills.some((skill) => skill.name === skillFilter);

      return matchesSearch && matchesSkill;
    });
  }, [users, search, skillFilter]);

  if (isLoading) {
    return <p>Загрузка тиммейтов...</p>;
  }

  return (
    <section>
      <h1>Тиммейты</h1>

      <div>
        <input
          placeholder="Поиск по имени, email, учебному заведению или описанию"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={skillFilter}
          onChange={(event) => setSkillFilter(event.target.value)}
        >
          <option value="all">Все навыки</option>

          {allSkillNames.map((skillName) => (
            <option key={skillName} value={skillName}>
              {skillName}
            </option>
          ))}
        </select>
      </div>

      {error && <p>{error}</p>}

      {filteredUsers.length === 0 ? (
        <p>Пользователи не найдены.</p>
      ) : (
        <div>
          {filteredUsers.map((user) => {
            const profilePath =
              user.id === currentUser?.id ? "/profile" : `/users/${user.id}`;

            return (
              <article key={user.id}>
                <div className="application-header">
                  <UserAvatar
                    src={user.avatar_url}
                    name={user.full_name}
                    size="md"
                  />

                  <div>
                    <h2>{user.full_name}</h2>
                    <p>{user.email}</p>
                  </div>
                </div>

                <p>Учебное заведение: {user.university ?? "Не указано"}</p>
                <p>Курс: {user.course ?? "Не указан"}</p>
                <p>{user.about ?? "Пользователь пока ничего не рассказал о себе."}</p>

                <div className="skills-grid">
                  {user.skills.length === 0 ? (
                    <span className="skill-checkbox">Навыки не указаны</span>
                  ) : (
                    user.skills.map((skill) => (
                      <span className="skill-checkbox" key={skill.id}>
                        {skill.name} — {skillLevelLabels[skill.level]}
                      </span>
                    ))
                  )}
                </div>

                <Link to={profilePath}>Открыть профиль</Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}