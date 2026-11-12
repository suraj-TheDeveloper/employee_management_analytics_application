from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.designation import Designation
from app.models.employee import Employee

SORT_COLUMNS = {"name": Designation.name, "created_at": Designation.created_at}


def get_by_id(db: Session, designation_id: int) -> Optional[Designation]:
    return db.scalar(
        select(Designation)
        .options(joinedload(Designation.department))
        .where(Designation.id == designation_id)
    )


def get_by_name_and_department(
    db: Session, name: str, department_id: int
) -> Optional[Designation]:
    return db.scalar(
        select(Designation).where(
            Designation.name == name, Designation.department_id == department_id
        )
    )


def count_active_employees(db: Session, designation_id: int) -> int:
    return db.scalar(
        select(func.count())
        .select_from(Employee)
        .where(Employee.designation_id == designation_id, Employee.status == "Active")
    )


def list_designations(
    db: Session,
    *,
    search: Optional[str],
    department_id: Optional[int],
    is_active: Optional[bool],
    sort_by: str,
    sort_order: str,
    page: int,
    page_size: int,
) -> tuple[list[Designation], int]:
    filters = []
    if search:
        filters.append(Designation.name.contains(search, autoescape=True))
    if department_id is not None:
        filters.append(Designation.department_id == department_id)
    if is_active is not None:
        filters.append(Designation.is_active == is_active)

    total = db.scalar(select(func.count()).select_from(Designation).where(*filters))

    column = SORT_COLUMNS[sort_by]
    order = column.desc() if sort_order == "desc" else column.asc()
    stmt = (
        select(Designation)
        .options(joinedload(Designation.department))
        .where(*filters)
        .order_by(order, Designation.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(db.scalars(stmt)), total