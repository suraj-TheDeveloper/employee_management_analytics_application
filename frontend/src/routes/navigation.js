export const navItems = [
  { to: "/", label: "Dashboard", roles: ["Admin", "HR", "Employee"], end: true },
  { to: "/employees", label: "Employees", roles: ["Admin", "HR"] },
  { to: "/departments", label: "Departments", roles: ["Admin", "HR"] },
  { to: "/leaves", label: "Leave requests", roles: ["Admin", "HR", "Employee"] },
  { to: "/users", label: "Users", roles: ["Admin"] },
];