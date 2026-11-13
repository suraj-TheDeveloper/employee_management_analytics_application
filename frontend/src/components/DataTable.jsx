import LoadingState from "./LoadingState";
import ErrorMessage from "./ErrorMessage";

// columns: [{ key, header, render?(row), sortKey?, className? }]
export default function DataTable({
  columns,
  rows,
  rowKey = "id",
  loading,
  error,
  onRetry,
  emptyMessage = "No records found.",
  sortBy,
  sortOrder,
  onSort,
}) {
  if (error) {
    return (
      <div className="table-state">
        <ErrorMessage message={error} />
        <button className="btn btn-secondary" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }
  if (loading && rows.length === 0) return <LoadingState message="Loading..." />;
  if (rows.length === 0) return <div className="table-state muted">{emptyMessage}</div>;

  return (
    <div className={`table-wrap ${loading ? "is-loading" : ""}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.sortKey && onSort ? (
                  <button className="sort-btn" onClick={() => onSort(col.sortKey)}>
                    {col.header}
                    {sortBy === col.sortKey && (sortOrder === "asc" ? " ▲" : " ▼")}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}