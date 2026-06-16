import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailsPage } from "./pages/ProjectDetailsPage";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UsersPage } from "./pages/UsersPage";
import { UserDetailsPage } from "./pages/UserDetailsPage";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link> | <Link to="/login">Login</Link> |{" "}
        <Link to="/register">Register</Link> |{" "}
        <Link to="/dashboard">Dashboard</Link> |{" "}
        <Link to="/projects">Projects</Link> |{" "}
        <Link to="/projects/create">Create Project</Link> |{" "}
        <Link to="/users">Students</Link> |{" "}
        <Link to="/profile">Profile</Link>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/create" element={<CreateProjectPage />} />
          <Route path="/projects/:id" element={<ProjectDetailsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;