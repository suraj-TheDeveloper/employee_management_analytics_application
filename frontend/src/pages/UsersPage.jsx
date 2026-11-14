import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Notice from "../components/Notice";
import StatusBadge from "../components/StatusBadge";
import UserForm from "../features/users/UserForm";
import RoleChangeForm from "../features/users/RoleChangeForm";
import { useAuth } from "../hooks/useAuth";
import { useDebounce } from "../hooks/useDebounce";
import { useFetch } from "../hooks/useFetch";
import { userService } from "../services/userService";
import { formatDate } from "../utils/format";

const PAGE_SIZE = 10;

export default function UsersPage() {
  const { user: me } = useAuth();
  const [filters, setFilters] = useState({ search: "", role_id: "", is_active: "" });
  const [sort, setSort] = useState({ by: "email", order: "asc" });
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [notice, setNotice] = useState("");

  const search = useDebounce(filters.search.trim());

  const { data, loading, error, reload } = useFetch(userService.list, {
    search,
    role_id: filters.role_id,
    is_active: filters.is_active,
    sort_by: sort.by,
    sort_order: sort.order,
    page,
    page_size: PAGE_SIZE,
  });
  const { data: rolesData } = useFetch(userService.listRoles, {});
  const roles = rolesData ?? [];

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

  function handleSort(key) {
    setSort((prev) =>
      prev.by === key
        ? { by: key, order: prev.order === "asc" ? "desc" : "asc" }
        : { by: key, order: "asc" }
    );
    setPage(1);
  }

  function handleSaved(message) {
    setCreateOpen(false);
    setRoleTarget(null);
    setNotice(message);
    reload();
  }

  async function confirmToggle() {
    const target = toggleTarget;
    await userService.setStatus(target.id, !target.is_active);
    setToggleTarget(null);
    setNotice(`${target.email} ${target.is_active ? "deactivated" : "activated"}`);
    reload();
  }

  const columns = [
    {
      key: "email",
      header: "Email",
      sortKey: "email",
      render: (u) => (
        <>
          {u.email}
          {u.id === me.id && <span className="you-tag">(you)</span>}
        </>
      ),
    },
    { key: "role", header: "Role", render: (u) => <span className="role-badge">{u.role.name}</span> },
    { key: "is_active", header: "Status", render: (u) => <StatusBadge active={u.is_active} /> },
    {
      key: "created_at",
      header: "Created",
      sortKey: "created_at",
      render: (u) => formatDate(u.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      className: "actions-col",
      render: (u) =>
        u.id === me.id ? (
          <span className="muted">—</span>
        ) : (
          <div className="row-actions">
            <button className="btn btn-link" onClick={() => setRoleTarget(u)}>
              Change role
            </button>
            <button className="btn btn-link" onClick={() => setToggleTarget(u)}>
              {u.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="muted">Manage login accounts, roles and access.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)} disabled={roles.length === 0}>
          Add user
        </button>
      </div>

      <Notice message={notice} />

      <div className="card">
        <div className="toolbar">
          <input
            type="search"
            name="search"
            placeholder="Search by email"
            aria-label="Search users"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select name="role_id" aria-label="Filter by role" value={filters.role_id} onChange={handleFilterChange}>
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select name="is_active" aria-label="Filter by status" value={filters.is_active} onChange={handleFilterChange}>
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
          emptyMessage="No users match your filters."
          sortBy={sort.by}
          sortOrder={sort.order}
          onSort={handleSort}
        />

        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      </div>

      {createOpen && (
        <Modal title="Add user" onClose={() => setCreateOpen(false)}>
          <UserForm roles={roles} onSaved={handleSaved} onCancel={() => setCreateOpen(false)} />
        </Modal>
      )}

      {roleTarget && (
        <Modal title="Change role" onClose={() => setRoleTarget(null)}>
          <RoleChangeForm user={roleTarget} roles={roles} onSaved={handleSaved} onCancel={() => setRoleTarget(null)} />
        </Modal>
      )}

      {toggleTarget && (
        <ConfirmDialog
          title={toggleTarget.is_active ? "Deactivate user" : "Activate user"}
          message={
            toggleTarget.is_active
              ? `Deactivate ${toggleTarget.email}? They will be signed out of every session on their next request.`
              : `Activate ${toggleTarget.email}? They will be able to sign in again.`
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