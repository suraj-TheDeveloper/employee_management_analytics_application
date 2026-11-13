import { useState } from "react";
import FormField from "../../components/FormField";
import ErrorMessage from "../../components/ErrorMessage";
import { departmentService } from "../../services/departmentService";
import { getErrorMessage, getFieldErrors } from "../../services/errors";

function validate(values) {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = "Name is required";
  else if (name.length < 2) errors.name = "Name must be at least 2 characters";
  else if (name.length > 100) errors.name = "Name must be at most 100 characters";
  if (values.description.length > 255) {
    errors.description = "Description must be at most 255 characters";
  }
  return errors;
}

// `department` present = edit mode, absent = create mode
export default function DepartmentForm({ department, onSaved, onCancel }) {
  const isEdit = Boolean(department);
  const [values, setValues] = useState({
    name: department?.name ?? "",
    description: department?.description ?? "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        // PUT replaces the whole record, so keep the current active flag
        await departmentService.update(department.id, {
          ...payload,
          is_active: department.is_active,
        });
      } else {
        await departmentService.create(payload);
      }
      onSaved(isEdit ? "Department updated" : "Department created");
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setSubmitError(getErrorMessage(error));
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ErrorMessage message={submitError} />
      <FormField
        id="name"
        name="name"
        label="Name"
        value={values.name}
        onChange={handleChange}
        error={errors.name}
        autoFocus
      />
      <FormField
        id="description"
        name="description"
        label="Description (optional)"
        as="textarea"
        rows={3}
        value={values.description}
        onChange={handleChange}
        error={errors.description}
      />
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Create department"}
        </button>
      </div>
    </form>
  );
}