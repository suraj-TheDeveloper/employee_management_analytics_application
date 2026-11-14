import { useState } from "react";
import FormField from "../../components/FormField";
import ErrorMessage from "../../components/ErrorMessage";
import { userService } from "../../services/userService";
import { getErrorMessage, getFieldErrors } from "../../services/errors";
import { EMAIL_PATTERN } from "../../utils/validation";

function validate(v) {
  const e = {};
  if (!v.email.trim()) e.email = "Email is required";
  else if (!EMAIL_PATTERN.test(v.email.trim())) e.email = "Enter a valid email address";
  if (!v.password) e.password = "Password is required";
  else if (v.password.length < 8) e.password = "At least 8 characters";
  else if (new TextEncoder().encode(v.password).length > 72) e.password = "Too long (72 bytes max)";
  if (!v.role_id) e.role_id = "Select a role";
  return e;
}

export default function UserForm({ roles, onSaved, onCancel }) {
  const [values, setValues] = useState({ email: "", password: "", role_id: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedRole = roles.find((r) => String(r.id) === values.role_id);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setSubmitError("");
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await userService.create({
        email: values.email.trim(),
        password: values.password,
        role_id: Number(values.role_id),
      });
      onSaved("User created");
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else setSubmitError(getErrorMessage(error)); // e.g. 409 duplicate email
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ErrorMessage message={submitError} />
      <FormField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="off"
        value={values.email}
        onChange={handleChange}
        error={errors.email}
        autoFocus
      />
      <FormField
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
      />
      <FormField
        id="role_id"
        name="role_id"
        as="select"
        label="Role"
        value={values.role_id}
        onChange={handleChange}
        error={errors.role_id}
      >
        <option value="">Select role</option>
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
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Creating..." : "Create user"}
        </button>
      </div>
    </form>
  );
}