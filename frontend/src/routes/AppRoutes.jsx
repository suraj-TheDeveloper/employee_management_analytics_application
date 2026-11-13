import { Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import ComingSoon from "../components/ComingSoon";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import DepartmentsPage from "../pages/DepartmentsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="leaves" element={<ComingSoon title="Leave requests" />} />

          <Route element={<ProtectedRoute roles={["Admin", "HR"]} />}>
            <Route path="employees" element={<ComingSoon title="Employees" />} />
            <Route path="departments" element={<DepartmentsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Admin"]} />}>
            <Route path="users" element={<ComingSoon title="Users" />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}