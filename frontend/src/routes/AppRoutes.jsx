import { Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import ComingSoon from "../components/ComingSoon";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import DepartmentsPage from "../pages/DepartmentsPage";
import EmployeesPage from "../pages/EmployeesPage";
import EmployeeDetailPage from "../pages/EmployeeDetailPage";
import MyProfilePage from "../pages/MyProfilePage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="leaves" element={<ComingSoon title="Leave requests" />} />

          <Route element={<ProtectedRoute roles={["Employee"]} />}>
            <Route path="profile" element={<MyProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Admin", "HR"]} />}>
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="employees/:id" element={<EmployeeDetailPage />} />
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