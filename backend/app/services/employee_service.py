from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.core.exceptions import (
    BusinessRuleError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
)
from app.core.security import hash_password
from app.models.employee import Employee
from app.models.user import User
from app.repositories import (
    department_repository,
    designation_repository,
    employee_repository,
    user_repository,
)
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.services.utils import commit_or_conflict
from app.schemas.employee import EmployeeCreate, EmployeeSelfUpdate, EmployeeUpdate

DUPLICATE_MSG = "An employee with this code or email already exists"


def _validate_org(
    db: Session,
    department_id: int,
    designation_id: int,
    current: Optional[Employee] = None,
) -> None:
    dept = department_repository.get_by_id(db, department_id)
    if not dept:
        raise NotFoundError("Department not found")
    desig = designation_repository.get_by_id(db, designation_id)
    if not desig:
        raise NotFoundError("Designation not found")
    if desig.department_id != department_id:
        raise BusinessRuleError("Designation does not belong to the selected department")

    dept_changed = current is None or current.department_id != department_id
    desig_changed = current is None or current.designation_id != designation_id
    if dept_changed and not dept.is_active:
        raise BusinessRuleError("Department is inactive")
    if desig_changed and not desig.is_active:
        raise BusinessRuleError("Designation is inactive")


def list_employees(db: Session, **query):
    joined_from, joined_to = query.get("joined_from"), query.get("joined_to")
    if joined_from and joined_to and joined_from > joined_to:
        raise BusinessRuleError("joined_from must not be after joined_to")
    return employee_repository.list_employees(db, **query)


def get_employee(db: Session, employee_id: int) -> Employee:
    emp = employee_repository.get_by_id(db, employee_id)
    if not emp:
        raise NotFoundError("Employee not found")
    return emp


def get_employee_for_user(db: Session, employee_id: int, user: User) -> Employee:
    emp = get_employee(db, employee_id)
    if user.role.name == "Employee" and emp.user_id != user.id:
        raise ForbiddenError("You can only view your own employee record")
    return emp


def get_my_employee(db: Session, user: User) -> Employee:
    emp = employee_repository.get_by_user_id(db, user.id)
    if not emp:
        raise NotFoundError("No employee record is linked to this account")
    return emp


def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    _validate_org(db, data.department_id, data.designation_id)

    if employee_repository.get_by_code(db, data.employee_code):
        raise ConflictError("Employee code already exists")
    if employee_repository.get_by_email(db, data.email):
        raise ConflictError("An employee with this email already exists")

    employee = Employee(**data.model_dump(exclude={"password"}))
    if employee.status == "Inactive" and employee.termination_date is None:
        employee.termination_date = date.today()

    if data.password:
        if user_repository.get_by_email(db, data.email):
            raise ConflictError("A user account with this email already exists")
        role = user_repository.get_role_by_name(db, "Employee")
        if not role:
            raise RuntimeError("Role 'Employee' is not seeded")
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            role_id=role.id,
            is_active=data.status == "Active",
        )
        db.add(user)
        db.flush()  # assigns user.id without committing
        employee.user_id = user.id

    db.add(employee)
    commit_or_conflict(db, DUPLICATE_MSG)  # one commit: user + employee together
    return get_employee(db, employee.id)


def update_employee(db: Session, employee_id: int, data: EmployeeUpdate) -> Employee:
    emp = get_employee(db, employee_id)
    _validate_org(db, data.department_id, data.designation_id, current=emp)

    if data.email != emp.email:
        if employee_repository.get_by_email(db, data.email):
            raise ConflictError("An employee with this email already exists")
        if emp.user_id:
            clash = user_repository.get_by_email(db, data.email)
            if clash and clash.id != emp.user_id:
                raise ConflictError("A user account with this email already exists")
            emp.user.email = data.email  # keep the login email in sync

    for field, value in data.model_dump().items():
        setattr(emp, field, value)
    commit_or_conflict(db, DUPLICATE_MSG)
    return get_employee(db, emp.id)

def update_my_contact(db: Session, user: User, data: EmployeeSelfUpdate) -> Employee:
    emp = get_my_employee(db, user)
    emp.phone = data.phone  # null clears the phone number
    commit_or_conflict(db, "Could not update contact details")
    return get_employee(db, emp.id)

def change_status(db: Session, employee_id: int, new_status: str) -> Employee:
    emp = get_employee(db, employee_id)
    if emp.status == new_status:
        return emp

    if new_status == "Active":
        if not emp.department.is_active or not emp.designation.is_active:
            raise BusinessRuleError(
                "Cannot reactivate: the department or designation is inactive"
            )
        emp.termination_date = None
    else:
        emp.termination_date = date.today()

    emp.status = new_status
    if emp.user:
        emp.user.is_active = new_status == "Active"  # login follows employment

    commit_or_conflict(db, "Could not update employee status")
    return get_employee(db, emp.id)