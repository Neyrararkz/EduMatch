import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../app/AuthProvider";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await login({ email, password });
      navigate("/projects");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось войти");
    }
  }

  return (
    <main className="public-page auth-page">
      <section className="auth-card">
        <h1>Вход</h1>

        <form onSubmit={handleSubmit}>
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

          {error && <p className="form-error">{error}</p>}

          <button type="submit">Войти</button>
        </form>

        <p className="auth-switch">
          Еще нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </section>
    </main>
  );
}