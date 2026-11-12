from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.employee import Employee

SORT_COLUMNS = {"name": Department.name, "created_at": Department.created_at}


def get_by_id(db: Session, department_id: int) -> Optional[Department]:
    return db.get(Department, department_id)


def get_by_name(db: Session, name: str) -> Optional[Department]:
    # utf8mb4_unicode_ci is case-insensitive, so "hr" matches "HR"
    return db.scalar(select(Department).where(Department.name == name))


def count_active_employees(db: Session, department_id: int) -> int:
    return db.scalar(
        select(func.count())
        .select_from(Employee)
        .where(Employee.department_id == department_id, Employee.status == "Active")
    )


def list_departments(
    db: Session,
    *,
    search: Optional[str],
    is_active: Optional[bool],
    sort_by: str,
    sort_order: str,
    page: int,
    page_size: int,
) -> tuple[list[Department], int]:
    filters = []
    if search:
        filters.append(Department.name.contains(search, autoescape=True))
    if is_active is not None:
        filters.append(Department.is_active == is_active)

    total = db.scalar(select(func.count()).select_from(Department).where(*filters))

    column = SORT_COLUMNS[sort_by]
    order = column.desc() if sort_order == "desc" else column.asc()
    stmt = (
        select(Department)
        .where(*filters)
        .order_by(order, Department.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(db.scalars(stmt)), total