import { useState } from "react";
import FormField from "../../components/FormField";
import ErrorMessage from "../../components/ErrorMessage";
import { leaveService } from "../../services/leaveService";
import { getErrorMessage, getFieldErrors } from "../../services/errors";
import { daysBetween, toInputDate } from "../../utils/format";
import { LEAVE_TYPES, MAX_BACKDATE_DAYS, MAX_LEAVE_DAYS } from "./constants";

function earliestStart() {
  const date = new Date();
  date.setDate(date.getDate() - MAX_BACKDATE_DAYS);
  return toInputDate(date);
}

function validate(v) {
  const e = {};
  if (!v.leave_type) e.leave_type = "Select a leave type";

  if (!v.start_date) e.start_date = "Start date is required";
  else if (v.start_date < earliestStart()) {
    e.start_date = `Cannot be more than ${MAX_BACKDATE_DAYS} days in the past`;
  }

  if (!v.end_date) e.end_date = "End date is required";
  else if (v.start_date && v.end_date < v.start_date) {
    e.end_date = "End date cannot be before the start date";
  } else if (v.start_date && daysBetween(v.start_date, v.end_date) > MAX_LEAVE_DAYS) {
    e.end_date = `A request cannot exceed ${MAX_LEAVE_DAYS} days`;
  }

  const reason = v.reason.trim();
  if (reason.length < 3) e.reason = "Please give a reason (at least 3 characters)";
  else if (reason.length > 500) e.reason = "At most 500 characters";
  return e;
}

export default function LeaveRequestForm({ onSaved, onCancel }) {
  const [values, setValues] = useState({ leave_type: "", start_date: "", end_date: "", reason: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const days =
    values.start_date && values.end_date && values.end_date >= values.start_date
      ? daysBetween(values.start_date, values.end_date)
      : null;

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
      await leaveService.create({ ...values, reason: values.reason.trim() });
      onSaved("Leave request submitted");
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else setSubmitError(getErrorMessage(error)); // e.g. 409 overlap, 400 business rule
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ErrorMessage message={submitError} />
      <FormField
        id="leave_type"
        name="leave_type"
        as="select"
        label="Leave type"
        value={values.leave_type}
        onChange={handleChange}
        error={errors.leave_type}
      >
        <option value="">Select leave type</option>
        {LEAVE_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </FormField>

      <div className="form-grid">
        <FormField
          id="start_date"
          name="start_date"
          type="date"
          label="Start date"
          min={earliestStart()}
          value={values.start_date}
          onChange={handleChange}
          error={errors.start_date}
        />
        <FormField
          id="end_date"
          name="end_date"
          type="date"
          label="End date"
          min={values.start_date || undefined}
          value={values.end_date}
          onChange={handleChange}
          error={errors.end_date}
        />
      </div>
      {days && (
        <p className="muted small">
          {days} day{days === 1 ? "" : "s"} requested
        </p>
      )}

      <FormField
        id="reason"
        name="reason"
        as="textarea"
        rows={3}
        label="Reason"
        value={values.reason}
        onChange={handleChange}
        error={errors.reason}
      />

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit request"}
        </button>
      </div>
    </form>
  );
}