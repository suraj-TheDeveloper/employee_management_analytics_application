import { useState } from "react";
import FormField from "../../components/FormField";
import ErrorMessage from "../../components/ErrorMessage";
import { userService } from "../../services/userService";
import { getErrorMessage } from "../../services/errors";

export default function RoleChangeForm({ user, roles, onSaved, onCancel }) {
  const [roleId, setRoleId] = useState(String(user.role.id));
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedRole = roles.find((r) => String(r.id) === roleId);
  const unchanged = roleId === String(user.role.id);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      await userService.setRole(user.id, Number(roleId));
      onSaved(`Role updated for ${user.email}`);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        Change the role for <strong>{user.email}</strong>. It takes effect on their next request.
      </p>
      <ErrorMessage message={submitError} />
      <FormField
        id="role_id"
        as="select"
        label="Role"
        value={roleId}
        onChange={(event) => setRoleId(event.target.value)}
      >
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </FormField>
      {selectedRole?.description && <p className="muted small">{selectedRole.description}</p>}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting || unchanged}>
          {submitting ? "Saving..." : "Save role"}
        </button>
      </div>
    </form>
  );
}