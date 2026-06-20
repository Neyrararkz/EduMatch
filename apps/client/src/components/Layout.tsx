import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../app/AuthProvider";
import { getNotificationsSummary } from "../shared/api/notifications";
import type { NotificationsSummary } from "../shared/types/notification";
import { UserAvatar } from "../shared/ui/UserAvatar";

type LayoutProps = {
  children: ReactNode;
};

const navItems = [
  { to: "/projects", label: "Проекты" },
  { to: "/users", label: "Тиммейты" },
  { to: "/applications", label: "Заявки" },
];

const emptySummary: NotificationsSummary = {
  pendingApplicationsCount: 0,
  unreadMessagesCount: 0,
  unreadMessagesByProject: [],
};

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, accessToken, logout } = useAuth();

  const [summary, setSummary] = useState<NotificationsSummary>(emptySummary);

  useEffect(() => {
    if (!accessToken) {
      setSummary(emptySummary);
      return;
    }

    const token = accessToken;
    let isMounted = true;

    async function loadSummary() {
      try {
        const response = await getNotificationsSummary(token);

        if (isMounted) {
          setSummary(response.summary);
        }
      } catch {
        if (isMounted) {
          setSummary(emptySummary);
        }
      }
    }

    function handleRefresh() {
      void loadSummary();
    }

    void loadSummary();

    const intervalId = window.setInterval(handleRefresh, 10000);

    window.addEventListener("edumatch-notifications-refresh", handleRefresh);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("edumatch-notifications-refresh", handleRefresh);
    };
  }, [accessToken]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/projects" className="brand">
            <img src="/favicon.png" alt="logo" className="brand-logo" />
            <span className="brand-text">EduMatch</span>
          </Link>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.to);

              const badgeCount =
                item.to === "/applications" ? summary.pendingApplicationsCount : 0;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span>{item.label}</span>

                  {badgeCount > 0 && (
                    <span className="notification-badge">
                      {formatBadgeCount(badgeCount)}
                    </span>
                  )}
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

            {summary.unreadMessagesCount > 0 && (
              <span className="notification-badge profile-notification-badge">
                {formatBadgeCount(summary.unreadMessagesCount)}
              </span>
            )}
          </button>
        </header>

        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}