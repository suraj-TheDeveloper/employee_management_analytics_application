import { useAuth } from "../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="card">
      <h1>Welcome</h1>
      <p>
        Signed in as <strong>{user.email}</strong> with the <strong>{user.role.name}</strong> role.
      </p>
      <p className="muted">Use the menu to open the sections available to your role.</p>
    </div>
  );
}