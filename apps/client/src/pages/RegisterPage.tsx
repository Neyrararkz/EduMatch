import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../app/AuthProvider";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("1");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await register({
        fullName,
        email,
        password,
        university,
        course: Number(course),
      });

      navigate("/projects");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось зарегистрироваться");
    }
  }

  return (
    <main className="public-page auth-page">
      <section className="auth-card">
        <h1>Регистрация</h1>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Имя</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Ваше имя"
            />
          </div>

          <div>
            <label>Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label>Пароль</label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Введите пароль"
            />
          </div>

          <div>
            <label>Учебное заведение</label>
            <input
              value={university}
              onChange={(event) => setUniversity(event.target.value)}
              placeholder="Школа/Колледж/Университет"
            />
          </div>

          <div>
            <label>Курс</label>
            <input
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              type="number"
              min="1"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit">Зарегистрироваться</button>
        </form>

        <p className="auth-switch">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </section>
    </main>
  );
}