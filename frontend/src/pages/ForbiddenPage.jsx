import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <div className="card">
      <h1>Access denied</h1>
      <p className="muted">Your role does not have permission to open this page.</p>
      <Link to="/">Back to dashboard</Link>
    </div>
  );
}