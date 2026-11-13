import { useState } from "react";
import ErrorMessage from "../components/ErrorMessage";
import FormField from "../components/FormField";
import LoadingState from "../components/LoadingState";
import Notice from "../components/Notice";
import EmployeeDetails from "../features/employees/EmployeeDetails";
import { useFetch } from "../hooks/useFetch";
import { employeeService } from "../services/employeeService";
import { getErrorMessage, getFieldErrors } from "../services/errors";
import { PHONE_PATTERN } from "../utils/validation";

function PhoneForm({ employee, onSaved, onCancel }) {
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const value = phone.trim();
    if (value && !PHONE_PATTERN.test(value)) {
      setFieldError("7 to 15 digits, optionally starting with +");
      return;
    }
    setFieldError("");
    setSubmitError("");
    setSubmitting(true);
    try {
      await employeeService.updateMine({ phone: value || null });
      onSaved();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors.phone) setFieldError(fieldErrors.phone);
      else setSubmitError(getErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="inline-form">
      <ErrorMessage message={submitError} />
      <FormField
        id="phone"
        label="Phone"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        error={fieldError}
        autoFocus
      />
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function MyProfilePage() {
  const { data, loading, error, reload } = useFetch(employeeService.getMine, {});
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");

  function handleSaved() {
    setEditing(false);
    setNotice("Phone number updated");
    reload();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My profile</h1>
          <p className="muted">Your employee record. You can update your phone number.</p>
        </div>
      </div>

      <Notice message={notice} />

      <div className="card">
        {error ? (
          <>
            <ErrorMessage message={error} />
            <button className="btn btn-secondary" onClick={reload}>
              Retry
            </button>
          </>
        ) : loading || !data ? (
          <LoadingState />
        ) : (
          <>
            <EmployeeDetails employee={data} />
            {editing ? (
              <PhoneForm employee={data} onSaved={handleSaved} onCancel={() => setEditing(false)} />
            ) : (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                Edit phone number
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}