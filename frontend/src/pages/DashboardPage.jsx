import ErrorMessage from "../components/ErrorMessage";
import StatCard from "../components/StatCard";
import { useAuth } from "../hooks/useAuth";
import { useFetch } from "../hooks/useFetch";
import { leaveService } from "../services/leaveService";
import { reportService } from "../services/reportService";
import { formatDate } from "../utils/format";

export default function DashboardPage() {
  const { user } = useAuth();
  const isReviewer = ["Admin", "HR"].includes(user.role.name);

  // Hooks can't be called conditionally, so `enabled` switches them on or off
  const summary = useFetch(reportService.summary, {}, { enabled: isReviewer });
  // page_size=1: we only need `total`, not the rows
  const pending = useFetch(leaveService.list, { status: "Pending", page: 1, page_size: 1 });
  const approved = useFetch(leaveService.list, { status: "Approved", page: 1, page_size: 1 }, { enabled: !isReviewer });

  const error = summary.error || pending.error || approved.error;

  function reloadAll() {
    if (isReviewer) summary.reload();
    pending.reload();
    if (!isReviewer) approved.reload();
  }

  const s = summary.data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Signed in as {user.email} ({user.role.name})
          </p>
        </div>
      </div>

      {error && (
        <div className="table-state">
          <ErrorMessage message={error} />
          <button className="btn btn-secondary" onClick={reloadAll}>
            Retry
          </button>
        </div>
      )}

      {isReviewer ? (
        <div className="stat-grid">
          <StatCard label="Total employees" value={s?.total_employees} loading={summary.loading} />
          <StatCard label="Active employees" value={s?.active_employees} loading={summary.loading} />
          <StatCard label="Inactive employees" value={s?.inactive_employees} loading={summary.loading} />
          <StatCard label="Departments" value={s?.departments} loading={summary.loading} />
          <StatCard
            label="On leave today"
            value={s?.on_leave}
            hint={s ? `As of ${formatDate(s.as_of)}` : undefined}
            loading={summary.loading}
          />
          <StatCard
            label="Pending leave requests"
            value={pending.data?.total}
            hint="Open review queue"
            to="/leaves"
            loading={pending.loading}
          />
        </div>
      ) : (
        <div className="stat-grid">
          <StatCard
            label="My pending requests"
            value={pending.data?.total}
            hint="View my requests"
            to="/leaves"
            loading={pending.loading}
          />
          <StatCard
            label="My approved requests"
            value={approved.data?.total}
            hint="View my requests"
            to="/leaves"
            loading={approved.loading}
          />
        </div>
      )}
    </div>
  );
}