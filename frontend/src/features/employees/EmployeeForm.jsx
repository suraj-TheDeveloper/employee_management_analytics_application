import { useState } from "react";
import FormField from "../../components/FormField";
import ErrorMessage from "../../components/ErrorMessage";
import { useFetch } from "../../hooks/useFetch";
import { departmentService } from "../../services/departmentService";
import { designationService } from "../../services/designationService";
import { employeeService } from "../../services/employeeService";
import { getErrorMessage, getFieldErrors } from "../../services/errors";
import { CODE_PATTERN, EMAIL_PATTERN, PHONE_PATTERN } from "../../utils/validation";

function validate(v, isEdit) {
  const e = {};
  if (!isEdit && !CODE_PATTERN.test(v.employee_code.trim())) {
    e.employee_code = "3 to 20 letters, digits or hyphens";
  }
  if (!v.first_name.trim()) e.first_name = "First name is required";
  else if (v.first_name.trim().length > 100) e.first_name = "At most 100 characters";
  if (!v.last_name.trim()) e.last_name = "Last name is required";
  else if (v.last_name.trim().length > 100) e.last_name = "At most 100 characters";
  if (!v.email.trim()) e.email = "Email is required";
  else if (!EMAIL_PATTERN.test(v.email.trim())) e.email = "Enter a valid email address";
  if (v.phone.trim() && !PHONE_PATTERN.test(v.phone.trim())) {
    e.phone = "7 to 15 digits, optionally starting with +";
  }
  if (!v.department_id) e.department_id = "Select a department";
  if (!v.designation_id) e.designation_id = "Select a designation";
  if (!v.joining_date) e.joining_date = "Joining date is required";
  if (!isEdit && v.password) {
    if (v.password.length < 8) e.password = "At least 8 characters";
    else if (new TextEncoder().encode(v.password).length > 72) e.password = "Too long (72 bytes max)";
  }
  return e;
}

// Make sure the employee's current value is selectable even if it is now inactive
function withCurrent(options, current) {
  if (!current || options.some((o) => o.id === current.id)) return options;
  return [current, ...options];
}

// `employee` present = edit mode, absent = create mode
export default function EmployeeForm({ employee, onSaved, onCancel }) {
  const isEdit = Boolean(employee);
  const [values, setValues] = useState({
    employee_code: employee?.employee_code ?? "",
    first_name: employee?.first_name ?? "",
    last_name: employee?.last_name ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    department_id: employee ? String(employee.department.id) : "",
    designation_id: employee ? String(employee.designation.id) : "",
    joining_date: employee?.joining_date ?? "",
    status: "Active",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: deptData, loading: deptLoading } = useFetch(departmentService.list, {
    is_active: "true",
    sort_by: "name",
    page_size: 100,
  });
  const { data: desigData, loading: desigLoading } = useFetch(
    designationService.list,
    { department_id: values.department_id, is_active: "true", sort_by: "name", page_size: 100 },
    { enabled: Boolean(values.department_id) }
  );

  const departments = withCurrent(deptData?.items ?? [], employee?.department);
  const sameDepartment = employee && values.department_id === String(employee.department.id);
  const designations = withCurrent(desigData?.items ?? [], sameDepartment ? employee.designation : null);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) =>
      name === "department_id"
        ? { ...prev, department_id: value, designation_id: "" } // child resets when parent changes
        : { ...prev, [name]: value }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(values, isEdit);
    setErrors(validationErrors);
    setSubmitError("");
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      department_id: Number(values.department_id),
      designation_id: Number(values.designation_id),
      joining_date: values.joining_date,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await employeeService.update(employee.id, payload);
      } else {
        await employeeService.create({
          ...payload,
          employee_code: values.employee_code.trim(),
          status: values.status,
          ...(values.password ? { password: values.password } : {}),
        });
      }
      onSaved(isEdit ? "Employee updated" : "Employee created");
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
      <div className="form-grid">
        <FormField
          id="employee_code"
          name="employee_code"
          label="Employee code"
          value={values.employee_code}
          onChange={handleChange}
          error={errors.employee_code}
          disabled={isEdit}
          autoFocus={!isEdit}
        />
        <FormField
          id="joining_date"
          name="joining_date"
          type="date"
          label="Joining date"
          value={values.joining_date}
          onChange={handleChange}
          error={errors.joining_date}
        />
        <FormField
          id="first_name"
          name="first_name"
          label="First name"
          value={values.first_name}
          onChange={handleChange}
          error={errors.first_name}
        />
        <FormField
          id="last_name"
          name="last_name"
          label="Last name"
          value={values.last_name}
          onChange={handleChange}
          error={errors.last_name}
        />
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <FormField
          id="phone"
          name="phone"
          label="Phone (optional)"
          value={values.phone}
          onChange={handleChange}
          error={errors.phone}
        />
        <FormField
          id="department_id"
          name="department_id"
          as="select"
          label="Department"
          value={values.department_id}
          onChange={handleChange}
          error={errors.department_id}
          disabled={deptLoading}
        >
          <option value="">{deptLoading ? "Loading..." : "Select department"}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </FormField>
        <FormField
          id="designation_id"
          name="designation_id"
          as="select"
          label="Designation"
          value={values.designation_id}
          onChange={handleChange}
          error={errors.designation_id}
          disabled={!values.department_id || desigLoading}
        >
          <option value="">
            {!values.department_id
              ? "Select a department first"
              : desigLoading
              ? "Loading..."
              : designations.length === 0
              ? "No active designations here"
              : "Select designation"}
          </option>
          {designations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </FormField>

        {!isEdit && (
          <>
            <FormField
              id="status"
              name="status"
              as="select"
              label="Employment status"
              value={values.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </FormField>
            <FormField
              id="password"
              name="password"
              type="password"
              label="Initial password (optional)"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
            />
          </>
        )}
      </div>
      {!isEdit && <p className="muted small">If you set a password, the employee also gets a login account.</p>}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Create employee"}
        </button>
      </div>
    </form>
  );
}