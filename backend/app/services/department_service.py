from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.department import Department
from app.repositories import department_repository
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from app.services.utils import commit_or_conflict

DUPLICATE_MSG = "A department with this name already exists"


def list_departments(db: Session, **query):
    return department_repository.list_departments(db, **query)


def get_department(db: Session, department_id: int) -> Department:
    dept = department_repository.get_by_id(db, department_id)
    if not dept:
        raise NotFoundError("Department not found")
    return dept


def create_department(db: Session, data: DepartmentCreate) -> Department:
    if department_repository.get_by_name(db, data.name):
        raise ConflictError(DUPLICATE_MSG)
    dept = Department(**data.model_dump())
    db.add(dept)
    commit_or_conflict(db, DUPLICATE_MSG)
    db.refresh(dept)
    return dept


def update_department(
    db: Session, department_id: int, data: DepartmentUpdate
) -> Department:
    dept = get_department(db, department_id)

    existing = department_repository.get_by_name(db, data.name)
    if existing and existing.id != dept.id:
        raise ConflictError(DUPLICATE_MSG)

    if dept.is_active and not data.is_active:
        if department_repository.count_active_employees(db, dept.id) > 0:
            raise BusinessRuleError(
                "Cannot deactivate a department that has active employees"
            )

    for field, value in data.model_dump().items():
        setattr(dept, field, value)
    commit_or_conflict(db, DUPLICATE_MSG)
    db.refresh(dept)
    return dept