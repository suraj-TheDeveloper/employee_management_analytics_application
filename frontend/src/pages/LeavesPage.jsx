import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import Notice from "../components/Notice";
import LeaveRequestForm from "../features/leaves/LeaveRequestForm";
import LeaveReviewForm from "../features/leaves/LeaveReviewForm";
import LeaveStatusBadge from "../features/leaves/LeaveStatusBadge";
import { LEAVE_STATUSES, LEAVE_TYPES } from "../features/leaves/constants";
import { useAuth } from "../hooks/useAuth";
import { useFetch } from "../hooks/useFetch";
import { leaveService } from "../services/leaveService";
import { formatDate } from "../utils/format";

const PAGE_SIZE = 10;

export default function LeavesPage() {
  const { user } = useAuth();
  const isReviewer = ["Admin", "HR"].includes(user.role.name);
  const canRequest = user.role.name === "Employee";

  // Reviewers open on the Pending queue; employees see their whole history
  const defaultFilters = { status: isReviewer ? "Pending" : "", leave_type: "", from: "", to: "" };
  const defaultSort = { by: "created_at", order: isReviewer ? "asc" : "desc" };

  const [filters, setFilters] = useState(defaultFilters);
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [notice, setNotice] = useState("");

  const rangeInvalid = Boolean(filters.from && filters.to && filters.from > filters.to);

  const { data, loading, error, reload } = useFetch(
    leaveService.list,
    {
      status: filters.status,
      leave_type: filters.leave_type,
      from_date: filters.from,
      to_date: filters.to,
      sort_by: sort.by,
      sort_order: sort.order,
      page,
      page_size: PAGE_SIZE,
    },
    { enabled: !rangeInvalid }
  );

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(defaultFilters);
    setPage(1);
  }

  function handleSort(key) {
    setSort((prev) =>
      prev.by === key
        ? { by: key, order: prev.order === "asc" ? "desc" : "asc" }
        : { by: key, order: key === "created_at" ? defaultSort.order : "asc" }
    );
    setPage(1);
  }

  function handleRequested(message) {
    setRequestOpen(false);
    setNotice(message);
    reload();
  }

  function handleReviewed(message) {
    setReviewTarget(null);
    setNotice(message);
    reload();
  }

  function closeReview() {
    setReviewTarget(null);
    reload(); // the request may have been reviewed by someone else meanwhile
  }

  const columns = [
    ...(isReviewer
      ? [
          {
            key: "employee",
            header: "Employee",
            render: (l) => (
              <div>
                {l.employee.first_name} {l.employee.last_name}
                <div className="muted small">{l.employee.employee_code}</div>
              </div>
            ),
          },
        ]
      : []),
    { key: "leave_type", header: "Type" },
    {
      key: "dates",
      header: "Dates",
      sortKey: "start_date",
      render: (l) => `${formatDate(l.start_date)} – ${formatDate(l.end_date)}`,
    },
    { key: "days", header: "Days" },
    {
      key: "reason",
      header: "Reason",
      render: (l) => (
        <span className="truncate" title={l.reason}>
          {l.reason}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (l) => <LeaveStatusBadge status={l.status} /> },
    {
      key: "decision",
      header: "Decision",
      render: (l) =>
        l.reviewer ? (
          <div>
            {l.reviewer.email}
            <div className="muted small">
              {formatDate(l.reviewed_at)}
              {l.reviewer_comment ? ` · ${l.reviewer_comment}` : ""}
            </div>
          </div>
        ) : (
          <span className="muted">—</span>
        ),
    },
    {
      key: "created_at",
      header: "Submitted",
      sortKey: "created_at",
      render: (l) => formatDate(l.created_at),
    },
    ...(isReviewer
      ? [
          {
            key: "actions",
            header: "Actions",
            className: "actions-col",
            render: (l) =>
              l.status === "Pending" ? (
                <button className="btn btn-link" onClick={() => setReviewTarget(l)}>
                  Review
                </button>
              ) : (
                <span className="muted">—</span>
              ),
          },
        ]
      : []),
  ];

  const filtersChanged = JSON.stringify(filters) !== JSON.stringify(defaultFilters);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isReviewer ? "Leave requests" : "My leave requests"}</h1>
          <p className="muted">
            {isReviewer
              ? "Review pending requests, oldest first."
              : "Request leave and track the status of your requests."}
          </p>
        </div>
        {canRequest && (
          <button className="btn btn-primary" onClick={() => setRequestOpen(true)}>
            Request leave
          </button>
        )}
      </div>

      <Notice message={notice} />

      <div className="card">
        <div className="toolbar">
          <select name="status" aria-label="Filter by status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All statuses</option>
            {LEAVE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="leave_type" aria-label="Filter by type" value={filters.leave_type} onChange={handleFilterChange}>
            <option value="">All types</option>
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="toolbar-field">
            Leave from
            <input type="date" name="from" value={filters.from} onChange={handleFilterChange} />
          </label>
          <label className="toolbar-field">
            to
            <input type="date" name="to" value={filters.to} onChange={handleFilterChange} />
          </label>
          {filtersChanged && (
            <button className="btn btn-link" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>
        {rangeInvalid && <p className="field-error">The "from" date must not be after the "to" date.</p>}

        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyMessage={
            filters.status === "Pending" && isReviewer
              ? "No pending requests. You're all caught up."
              : "No leave requests match your filters."
          }
          sortBy={sort.by}
          sortOrder={sort.order}
          onSort={handleSort}
        />

        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      </div>

      {requestOpen && (
        <Modal title="Request leave" onClose={() => setRequestOpen(false)}>
          <LeaveRequestForm onSaved={handleRequested} onCancel={() => setRequestOpen(false)} />
        </Modal>
      )}

      {reviewTarget && (
        <Modal title="Review leave request" onClose={closeReview}>
          <LeaveReviewForm leave={reviewTarget} onSaved={handleReviewed} onCancel={closeReview} />
        </Modal>
      )}
    </div>
  );
}