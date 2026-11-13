import StatusBadge from "../../components/StatusBadge";
import { formatDate } from "../../utils/format";

export default function EmployeeDetails({ employee }) {
  const rows = [
    ["Employee code", employee.employee_code],
    ["Name", `${employee.first_name} ${employee.last_name}`],
    ["Email", employee.email],
    ["Phone", employee.phone || "—"],
    ["Department", employee.department.name],
    ["Designation", employee.designation.name],
    ["Joining date", formatDate(employee.joining_date)],
    ["Status", <StatusBadge key="status" active={employee.status === "Active"} activeLabel="Active" inactiveLabel="Inactive" />],
  ];
  if (employee.termination_date) {
    rows.push(["Termination date", formatDate(employee.termination_date)]);
  }

  return (
    <dl className="details">
      {rows.map(([label, value]) => (
        <div key={label} className="details-row">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}