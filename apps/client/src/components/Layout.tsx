import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthProvider";
import { UserAvatar } from "../shared/ui/UserAvatar";

type LayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  { to: "/projects", label: "Проекты" },
  { to: "/users", label: "Тиммейты" },
  { to: "/applications", label: "Заявки" },
];

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/projects")) return "Проекты";
  if (pathname === "/users") return "Тиммейты";
  if (pathname.startsWith("/users/")) return "Профиль";
  if (pathname.startsWith("/applications")) return "Заявки";
  if (pathname.startsWith("/profile")) return "Профиль";
  return "EduMatch";
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/projects" className="brand">
            <span className="brand-mark" />
            <span className="brand-text">EduMatch</span>
          </Link>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button type="button" className="sidebar-logout" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <h1 className="topbar-title"> </h1>

          <button
            type="button"
            className="profile-icon-button"
            onClick={() => navigate("/profile")}
          >
            <UserAvatar src={user?.avatar_url} name={user?.full_name} size="sm" />
          </button>
        </header>

        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}