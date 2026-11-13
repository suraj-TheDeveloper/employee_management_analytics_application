from datetime import date, timedelta

from sqlalchemy import func, update
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BusinessRuleError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
)
from app.models.employee import Employee
from app.models.leave_request import LeaveRequest
from app.models.user import User
from app.repositories import employee_repository, leave_repository
from app.schemas.leave import LeaveCreate, LeaveReview
from app.services.utils import commit_or_conflict

MAX_BACKDATE_DAYS = 30
MAX_LEAVE_DAYS = 60


def _my_employee(db: Session, user: User) -> Employee:
    emp = employee_repository.get_by_user_id(db, user.id)
    if not emp:
        raise NotFoundError("No employee record is linked to this account")
    return emp


def get_leave(db: Session, leave_id: int) -> LeaveRequest:
    leave = leave_repository.get_by_id(db, leave_id)
    if not leave:
        raise NotFoundError("Leave request not found")
    return leave


def get_leave_for_user(db: Session, leave_id: int, user: User) -> LeaveRequest:
    leave = get_leave(db, leave_id)
    if user.role.name == "Employee" and leave.employee.user_id != user.id:
        raise ForbiddenError("You can only view your own leave requests")
    return leave


def create_leave(db: Session, user: User, data: LeaveCreate) -> LeaveRequest:
    emp = _my_employee(db, user)
    if emp.status != "Active":
        raise BusinessRuleError("Inactive employees cannot submit leave requests")

    earliest = date.today() - timedelta(days=MAX_BACKDATE_DAYS)
    if data.start_date < earliest:
        raise BusinessRuleError(
            f"Leave cannot start more than {MAX_BACKDATE_DAYS} days in the past"
        )
    if (data.end_date - data.start_date).days + 1 > MAX_LEAVE_DAYS:
        raise BusinessRuleError(f"A request cannot exceed {MAX_LEAVE_DAYS} days")
    if leave_repository.has_overlap(db, emp.id, data.start_date, data.end_date):
        raise ConflictError(
            "You already have a pending or approved leave overlapping these dates"
        )

    leave = LeaveRequest(employee_id=emp.id, **data.model_dump())  # status defaults to Pending
    db.add(leave)
    commit_or_conflict(db, "Could not submit leave request")
    return get_leave(db, leave.id)


def list_leaves(db: Session, user: User, **query):
    if user.role.name == "Employee":
        # Never trust the client: force the filter to the caller's own record
        query["employee_id"] = _my_employee(db, user).id
    from_date, to_date = query.get("from_date"), query.get("to_date")
    if from_date and to_date and from_date > to_date:
        raise BusinessRuleError("from_date must not be after to_date")
    return leave_repository.list_leaves(db, **query)


def review_leave(
    db: Session, leave_id: int, reviewer: User, data: LeaveReview
) -> LeaveRequest:
    leave = get_leave(db, leave_id)

    if leave.employee.user_id == reviewer.id:
        raise ForbiddenError("You cannot review your own leave request")
    if leave.status != "Pending":
        raise ConflictError(f"This leave request is already {leave.status}")

    # Atomic guard: only succeeds if the row is STILL Pending at write time
    result = db.execute(
        update(LeaveRequest)
        .where(LeaveRequest.id == leave_id, LeaveRequest.status == "Pending")
        .values(
            status=data.decision,
            reviewer_id=reviewer.id,
            reviewer_comment=data.comment,
            reviewed_at=func.now(),
        )
        .execution_options(synchronize_session=False)
    )
    if result.rowcount == 0:
        db.rollback()
        raise ConflictError("This leave request was just reviewed by someone else")
    db.commit()
    return get_leave(db, leave_id)