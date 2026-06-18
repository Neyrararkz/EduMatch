import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./app/ProtectedRoute";
import { useAuth } from "./app/AuthProvider";

import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { UsersPage } from "./pages/UsersPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { ApplicationsPage } from "./pages/ApplicationsPage";

function Navigation() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <Link to="/projects">Проекты</Link> |{" "}
          <Link to="/users">Тиммейты</Link> |{" "}
          <Link to="/profile">Профиль</Link> |{" "}
          <Link to="/applications">Заявки</Link> |{" "}
          <button type="button" onClick={logout}>
            Выйти
          </button>
        </>
      ) : (
        <>
      <Link to="/">Главная</Link> |{" "}
          <Link to="/login">Войти</Link> |{" "}
          <Link to="/register">Регистрация</Link>
        </>
      )}
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <ApplicationsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;