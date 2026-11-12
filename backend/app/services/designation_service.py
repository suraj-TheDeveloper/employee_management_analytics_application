from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.designation import Designation
from app.repositories import department_repository, designation_repository
from app.schemas.designation import DesignationCreate, DesignationUpdate
from app.services.utils import commit_or_conflict

DUPLICATE_MSG = "This designation already exists in the department"


def _require_active_department(db: Session, department_id: int) -> None:
    dept = department_repository.get_by_id(db, department_id)
    if not dept:
        raise NotFoundError("Department not found")
    if not dept.is_active:
        raise BusinessRuleError("Department is inactive")


def list_designations(db: Session, **query):
    return designation_repository.list_designations(db, **query)


def get_designation(db: Session, designation_id: int) -> Designation:
    desig = designation_repository.get_by_id(db, designation_id)
    if not desig:
        raise NotFoundError("Designation not found")
    return desig


def create_designation(db: Session, data: DesignationCreate) -> Designation:
    _require_active_department(db, data.department_id)
    if designation_repository.get_by_name_and_department(
        db, data.name, data.department_id
    ):
        raise ConflictError(DUPLICATE_MSG)

    desig = Designation(**data.model_dump())
    db.add(desig)
    commit_or_conflict(db, DUPLICATE_MSG)
    return get_designation(db, desig.id)


def update_designation(
    db: Session, designation_id: int, data: DesignationUpdate
) -> Designation:
    desig = get_designation(db, designation_id)
    has_active_employees = (
        designation_repository.count_active_employees(db, desig.id) > 0
    )

    if data.department_id != desig.department_id:
        _require_active_department(db, data.department_id)
        if has_active_employees:
            raise BusinessRuleError(
                "Cannot move a designation with active employees to another department"
            )

    existing = designation_repository.get_by_name_and_department(
        db, data.name, data.department_id
    )
    if existing and existing.id != desig.id:
        raise ConflictError(DUPLICATE_MSG)

    if desig.is_active and not data.is_active and has_active_employees:
        raise BusinessRuleError("Cannot deactivate a designation with active employees")

    for field, value in data.model_dump().items():
        setattr(desig, field, value)
    commit_or_conflict(db, DUPLICATE_MSG)
    return get_designation(db, desig.id)