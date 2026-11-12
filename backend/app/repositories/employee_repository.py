from datetime import date
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.employee import Employee

SORT_COLUMNS = {
    "first_name": Employee.first_name,
    "last_name": Employee.last_name,
    "employee_code": Employee.employee_code,
    "joining_date": Employee.joining_date,
    "created_at": Employee.created_at,
}


def _with_relations():
    return (joinedload(Employee.department), joinedload(Employee.designation))


def get_by_id(db: Session, employee_id: int) -> Optional[Employee]:
    return db.scalar(
        select(Employee).options(*_with_relations()).where(Employee.id == employee_id)
    )


def get_by_user_id(db: Session, user_id: int) -> Optional[Employee]:
    return db.scalar(
        select(Employee).options(*_with_relations()).where(Employee.user_id == user_id)
    )


def get_by_code(db: Session, code: str) -> Optional[Employee]:
    return db.scalar(select(Employee).where(Employee.employee_code == code))


def get_by_email(db: Session, email: str) -> Optional[Employee]:
    return db.scalar(select(Employee).where(Employee.email == email))


def list_employees(
    db: Session,
    *,
    search: Optional[str],
    department_id: Optional[int],
    designation_id: Optional[int],
    status: Optional[str],
    joined_from: Optional[date],
    joined_to: Optional[date],
    sort_by: str,
    sort_order: str,
    page: int,
    page_size: int,
) -> tuple[list[Employee], int]:
    filters = []
    if search:
        full_name = func.concat(Employee.first_name, " ", Employee.last_name)
        filters.append(
            or_(
                full_name.contains(search, autoescape=True),
                Employee.email.contains(search, autoescape=True),
                Employee.employee_code.contains(search, autoescape=True),
            )
        )
    if department_id is not None:
        filters.append(Employee.department_id == department_id)
    if designation_id is not None:
        filters.append(Employee.designation_id == designation_id)
    if status:
        filters.append(Employee.status == status)
    if joined_from:
        filters.append(Employee.joining_date >= joined_from)
    if joined_to:
        filters.append(Employee.joining_date <= joined_to)

    total = db.scalar(select(func.count()).select_from(Employee).where(*filters))

    column = SORT_COLUMNS[sort_by]
    order = column.desc() if sort_order == "desc" else column.asc()
    stmt = (
        select(Employee)
        .options(*_with_relations())
        .where(*filters)
        .order_by(order, Employee.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(db.scalars(stmt)), total