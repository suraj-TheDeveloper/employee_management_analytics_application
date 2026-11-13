import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Notice from "../components/Notice";
import StatusBadge from "../components/StatusBadge";
import DepartmentForm from "../features/departments/DepartmentForm";
import { useDebounce } from "../hooks/useDebounce";
import { useFetch } from "../hooks/useFetch";
import { departmentService } from "../services/departmentService";
import { formatDate } from "../utils/format";

const PAGE_SIZE = 10;

export default function DepartmentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState({ by: "name", order: "asc" });
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState(null); // null | { mode: "create" } | { mode: "edit", department }
  const [toggleTarget, setToggleTarget] = useState(null);
  const [notice, setNotice] = useState("");

  const search = useDebounce(searchInput.trim());

  const { data, loading, error, reload } = useFetch(departmentService.list, {
    search,
    is_active: status,
    sort_by: sort.by,
    sort_order: sort.order,
    page,
    page_size: PAGE_SIZE,
  });

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  function handleSearchChange(event) {
    setSearchInput(event.target.value);
    setPage(1);
  }

  function handleStatusChange(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  function handleSort(key) {
    setSort((prev) =>
      prev.by === key
        ? { by: key, order: prev.order === "asc" ? "desc" : "asc" }
        : { by: key, order: "asc" }
    );
    setPage(1);
  }

  function handleSaved(message) {
    setFormState(null);
    setNotice(message);
    reload();
  }

  async function confirmToggle() {
    const target = toggleTarget;
    await departmentService.update(target.id, {
      name: target.name,
      description: target.description,
      is_active: !target.is_active,
    });
    setToggleTarget(null);
    setNotice(`Department ${target.is_active ? "deactivated" : "activated"}`);
    reload();
  }

  const columns = [
    { key: "name", header: "Name", sortKey: "name" },
    {
      key: "description",
      header: "Description",
      render: (d) => d.description || <span className="muted">—</span>,
    },
    { key: "is_active", header: "Status", render: (d) => <StatusBadge active={d.is_active} /> },
    {
      key: "created_at",
      header: "Created",
      sortKey: "created_at",
      render: (d) => formatDate(d.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      className: "actions-col",
      render: (d) => (
        <div className="row-actions">
          <button className="btn btn-link" onClick={() => setFormState({ mode: "edit", department: d })}>
            Edit
          </button>
          <button className="btn btn-link" onClick={() => setToggleTarget(d)}>
            {d.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Departments</h1>
          <p className="muted">Manage the departments employees belong to.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setFormState({ mode: "create" })}>
          Add department
        </button>
      </div>

      <Notice message={notice} />

      <div className="card">
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search by name"
            aria-label="Search departments"
            value={searchInput}
            onChange={handleSearchChange}
          />
          <select aria-label="Filter by status" value={status} onChange={handleStatusChange}>
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyMessage="No departments found."
          sortBy={sort.by}
          sortOrder={sort.order}
          onSort={handleSort}
        />

        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      </div>

      {formState && (
        <Modal
          title={formState.mode === "edit" ? "Edit department" : "Add department"}
          onClose={() => setFormState(null)}
        >
          <DepartmentForm
            department={formState.department}
            onSaved={handleSaved}
            onCancel={() => setFormState(null)}
          />
        </Modal>
      )}

      {toggleTarget && (
        <ConfirmDialog
          title={toggleTarget.is_active ? "Deactivate department" : "Activate department"}
          message={
            toggleTarget.is_active
              ? `Deactivate "${toggleTarget.name}"? New employees can no longer be added to it.`
              : `Activate "${toggleTarget.name}" again?`
          }
          confirmLabel={toggleTarget.is_active ? "Deactivate" : "Activate"}
          danger={toggleTarget.is_active}
          onConfirm={confirmToggle}
          onCancel={() => setToggleTarget(null)}
        />
      )}
    </div>
  );
}