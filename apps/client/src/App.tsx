import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./app/ProtectedRoute";
import { useAuth } from "./app/AuthProvider";

import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { UserProfilePage } from "./pages/UserProfilePage";

function Navigation() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav>
      <Link to="/">Home</Link> |{" "}

      {isAuthenticated ? (
        <>
          <Link to="/dashboard">Dashboard</Link> |{" "}
          <Link to="/projects">Projects</Link> |{" "}
          <Link to="/projects/create">Create Project</Link> |{" "}
          <Link to="/users">Students</Link> |{" "}
          <Link to="/profile">Profile</Link> |{" "}
          <button type="button" onClick={logout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link> |{" "}
          <Link to="/register">Register</Link>
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
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
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;