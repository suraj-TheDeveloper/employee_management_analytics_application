import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingState from "../components/LoadingState";
import ForbiddenPage from "../pages/ForbiddenPage";

// With no `roles`: requires a logged-in user. With `roles`: also requires one of them.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState message="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role.name)) return <ForbiddenPage />;
  return <Outlet />;
}