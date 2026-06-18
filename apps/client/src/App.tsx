import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./app/ProtectedRoute";
import { useAuth } from "./app/AuthProvider";
import { Layout } from "./components/Layout";

import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { UsersPage } from "./pages/UsersPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { ApplicationsPage } from "./pages/ApplicationsPage";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/projects" replace /> : <HomePage />
        }
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/projects" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/projects" replace /> : <RegisterPage />}
      />

      <Route
        path="/projects"
        element={
          <ProtectedLayout>
            <ProjectsPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedLayout>
            <UsersPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/users/:id"
        element={
          <ProtectedLayout>
            <UserProfilePage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedLayout>
            <UserProfilePage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/applications"
        element={
          <ProtectedLayout>
            <ApplicationsPage />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;