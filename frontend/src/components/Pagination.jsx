export default function Pagination({ page, pageSize, total, onPageChange }) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="pagination">
      <span className="muted">
        Showing {start}–{end} of {total}
      </span>
      <div className="pagination-controls">
        <button className="btn btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}