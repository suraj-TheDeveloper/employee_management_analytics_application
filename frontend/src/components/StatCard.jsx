import { Link } from "react-router-dom";

export default function StatCard({ label, value, hint, loading, to }) {
  const body = (
    <>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{loading ? "…" : value ?? "—"}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </>
  );

  return to ? (
    <Link to={to} className="stat-card stat-link">
      {body}
    </Link>
  ) : (
    <div className="stat-card">{body}</div>
  );
}