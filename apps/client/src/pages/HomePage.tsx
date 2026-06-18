import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="public-page home-page">
      <section className="home-hero">
        <h1>EduMatch</h1>

        <p>
          Платформа для студентов, где можно находить проекты, собирать команду,
          искать тиммейтов и работать вместе.
        </p>

        <div className="home-actions">
          <Link className="public-button public-button-primary" to="/login">
            Sign in
          </Link>

          <Link className="public-button public-button-secondary" to="/register">
            Sign up
          </Link>
        </div>
      </section>
    </main>
  );
}