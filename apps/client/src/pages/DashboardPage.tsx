import { useAuth } from "../app/AuthProvider";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <section>
      <h1>Dashboard</h1>

      {user && (
        <div>
          <h2>Hello, {user.full_name}</h2>
          <p>Email: {user.email}</p>
          <p>University: {user.university ?? "Not specified"}</p>
          <p>Course: {user.course ?? "Not specified"}</p>
        </div>
      )}
    </section>
  );
}