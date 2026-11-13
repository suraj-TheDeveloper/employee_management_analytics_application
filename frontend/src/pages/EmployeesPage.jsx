import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Notice from "../components/Notice";
import StatusBadge from "../components/StatusBadge";
import EmployeeForm from "../features/employees/EmployeeForm";
import { useDebounce } from "../hooks/useDebounce";
import { useFetch } from "../hooks/useFetch";
import { departmentService } from "../services/departmentService";
import { employeeService } from "../services/employeeService";
import { formatDate } from "../utils/format";

const PAGE_SIZE = 10;
const EMPTY_FILTERS = { search: "", department: "", status: "", from: "", to: "" };

export default function EmployeesPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState({ by: "first_name", order: "asc" });
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState(null); // null | { mode: "create" } | { mode: "edit", employee }
  const [toggleTarget, setToggleTarget] = useState(null);
  const [notice, setNotice] = useState("");

  const search = useDebounce(filters.search.trim());
  const rangeInvalid = Boolean(filters.from && filters.to && filters.from > filters.to);

  const { data, loading, error, reload } = useFetch(
    employeeService.list,
    {
      search,
      department_id: filters.department,
      status: filters.status,
      joined_from: filters.from,
      joined_to: filters.to,
      sort_by: sort.by,
      sort_order: sort.order,
      page,
      page_size: PAGE_SIZE,
    },
    { enabled: !rangeInvalid }
  );

  const { data: deptData } = useFetch(departmentService.list, { sort_by: "name", page_size: 100 });

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

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
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
    const next = target.status === "Active" ? "Inactive" : "Active";
    await employeeService.changeStatus(target.id, next);
    setToggleTarget(null);
    setNotice(`${target.first_name} ${target.last_name} is now ${next}`);
    reload();
  }

  const columns = [
    { key: "employee_code", header: "Code", sortKey: "employee_code" },
    {
      key: "name",
      header: "Name",
      sortKey: "first_name",
      render: (e) => (
        <Link to={`/employees/${e.id}`}>
          {e.first_name} {e.last_name}
        </Link>
      ),
    },
    { key: "email", header: "Email" },
    { key: "department", header: "Department", render: (e) => e.department.name },
    { key: "designation", header: "Designation", render: (e) => e.designation.name },
    {
      key: "joining_date",
      header: "Joined",
      sortKey: "joining_date",
      render: (e) => formatDate(e.joining_date),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => <StatusBadge active={e.status === "Active"} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "actions-col",
      render: (e) => (
        <div className="row-actions">
          <button className="btn btn-link" onClick={() => setFormState({ mode: "edit", employee: e })}>
            Edit
          </button>
          <button className="btn btn-link" onClick={() => setToggleTarget(e)}>
            {e.status === "Active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      ),
    },
  ];

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="muted">Search, filter and manage employee records.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setFormState({ mode: "create" })}>
          Add employee
        </button>
      </div>

      <Notice message={notice} />

      <div className="card">
        <div className="toolbar">
          <input
            type="search"
            name="search"
            placeholder="Search name, email or code"
            aria-label="Search employees"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select name="department" aria-label="Filter by department" value={filters.department} onChange={handleFilterChange}>
            <option value="">All departments</option>
            {(deptData?.items ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select name="status" aria-label="Filter by status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <label className="toolbar-field">
            Joined from
            <input type="date" name="from" value={filters.from} onChange={handleFilterChange} />
          </label>
          <label className="toolbar-field">
            to
            <input type="date" name="to" value={filters.to} onChange={handleFilterChange} />
          </label>
          {hasFilters && (
            <button className="btn btn-link" onClick={clearFilters}>
              Clear filters
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
          emptyMessage="No employees match your filters."
          sortBy={sort.by}
          sortOrder={sort.order}
          onSort={handleSort}
        />

        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      </div>

      {formState && (
        <Modal
          wide
          title={formState.mode === "edit" ? "Edit employee" : "Add employee"}
          onClose={() => setFormState(null)}
        >
          <EmployeeForm employee={formState.employee} onSaved={handleSaved} onCancel={() => setFormState(null)} />
        </Modal>
      )}

      {toggleTarget && (
        <ConfirmDialog
          title={toggleTarget.status === "Active" ? "Deactivate employee" : "Reactivate employee"}
          message={
            toggleTarget.status === "Active"
              ? `Deactivate ${toggleTarget.first_name} ${toggleTarget.last_name}? Their login (if any) will be disabled and the termination date set to today.`
              : `Reactivate ${toggleTarget.first_name} ${toggleTarget.last_name}? Their login (if any) will be enabled again.`
          }
          confirmLabel={toggleTarget.status === "Active" ? "Deactivate" : "Reactivate"}
          danger={toggleTarget.status === "Active"}
          onConfirm={confirmToggle}
          onCancel={() => setToggleTarget(null)}
        />
      )}
    </div>
  );
}