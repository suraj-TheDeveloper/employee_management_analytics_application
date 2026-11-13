from datetime import date
from typing import Optional

from sqlalchemy import and_, case, extract, func, or_, select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.employee import Employee
from app.models.leave_request import LeaveRequest


def employee_counts(db: Session, department_id: Optional[int]) -> tuple[int, int, int]:
    stmt = select(
        func.count(Employee.id),
        func.count(case((Employee.status == "Active", 1))),
        func.count(case((Employee.status == "Inactive", 1))),
    )
    if department_id is not None:
        stmt = stmt.where(Employee.department_id == department_id)
    total, active, inactive = db.execute(stmt).one()
    return total, active, inactive


def count_departments(db: Session, department_id: Optional[int]) -> int:
    stmt = select(func.count(Department.id)).where(Department.is_active.is_(True))
    if department_id is not None:
        stmt = stmt.where(Department.id == department_id)
    return db.scalar(stmt)


def count_on_leave(db: Session, on_date: date, department_id: Optional[int]) -> int:
    stmt = (
        select(func.count(func.distinct(LeaveRequest.employee_id)))
        .select_from(LeaveRequest)
        .join(Employee, Employee.id == LeaveRequest.employee_id)
        .where(
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date <= on_date,
            LeaveRequest.end_date >= on_date,
            Employee.status == "Active",
        )
    )
    if department_id is not None:
        stmt = stmt.where(Employee.department_id == department_id)
    return db.scalar(stmt)


def department_distribution(
    db: Session, status: Optional[str]
) -> list[tuple[int, str, int]]:
    # The status filter goes in the JOIN condition, not WHERE, so departments
    # with zero matching employees still appear with a count of 0.
    on_clause = Employee.department_id == Department.id
    if status:
        on_clause = and_(on_clause, Employee.status == status)

    count_col = func.count(Employee.id)
    stmt = (
        select(Department.id, Department.name, count_col)
        .outerjoin(Employee, on_clause)
        .group_by(Department.id, Department.name, Department.is_active)
        .having(or_(Department.is_active.is_(True), count_col > 0))
        .order_by(count_col.desc(), Department.name)
    )
    return [(row[0], row[1], row[2]) for row in db.execute(stmt)]


def _count_by_month(
    db: Session, date_column, date_from: date, date_to: date, department_id: Optional[int]
) -> dict[tuple[int, int], int]:
    year = extract("year", date_column)
    month = extract("month", date_column)
    stmt = (
        select(year, month, func.count(Employee.id))
        .where(date_column >= date_from, date_column <= date_to)
        .group_by(year, month)
    )
    if department_id is not None:
        stmt = stmt.where(Employee.department_id == department_id)
    return {(int(y), int(m)): c for y, m, c in db.execute(stmt)}


def joiners_by_month(db, date_from, date_to, department_id):
    return _count_by_month(db, Employee.joining_date, date_from, date_to, department_id)


def leavers_by_month(db, date_from, date_to, department_id):
    return _count_by_month(db, Employee.termination_date, date_from, date_to, department_id)