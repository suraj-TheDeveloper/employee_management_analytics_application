import { Link, useParams } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import LoadingState from "../components/LoadingState";
import EmployeeDetails from "../features/employees/EmployeeDetails";
import { useFetch } from "../hooks/useFetch";
import { employeeService } from "../services/employeeService";

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(employeeService.get, { id });

  return (
    <div>
      <Link to="/employees" className="back-link">
        &larr; Back to employees
      </Link>
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
            <h1>
              {data.first_name} {data.last_name}
            </h1>
            <EmployeeDetails employee={data} />
          </>
        )}
      </div>
    </div>
  );
}