from datetime import date
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.leave_request import LeaveRequest

SORT_COLUMNS = {
    "created_at": LeaveRequest.created_at,
    "start_date": LeaveRequest.start_date,
    "end_date": LeaveRequest.end_date,
}


def _with_relations():
    return (joinedload(LeaveRequest.employee), joinedload(LeaveRequest.reviewer))


def get_by_id(db: Session, leave_id: int) -> Optional[LeaveRequest]:
    return db.scalar(
        select(LeaveRequest)
        .options(*_with_relations())
        .where(LeaveRequest.id == leave_id)
    )


def has_overlap(
    db: Session, employee_id: int, start_date: date, end_date: date
) -> bool:
    # Two ranges overlap when each starts on or before the other ends
    stmt = (
        select(LeaveRequest.id)
        .where(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status.in_(("Pending", "Approved")),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        )
        .limit(1)
    )
    return db.scalar(stmt) is not None


def list_leaves(
    db: Session,
    *,
    employee_id: Optional[int],
    status: Optional[str],
    leave_type: Optional[str],
    from_date: Optional[date],
    to_date: Optional[date],
    sort_by: str,
    sort_order: str,
    page: int,
    page_size: int,
) -> tuple[list[LeaveRequest], int]:
    filters = []
    if employee_id is not None:
        filters.append(LeaveRequest.employee_id == employee_id)
    if status:
        filters.append(LeaveRequest.status == status)
    if leave_type:
        filters.append(LeaveRequest.leave_type == leave_type)
    if from_date:  # keep requests that overlap the [from_date, to_date] window
        filters.append(LeaveRequest.end_date >= from_date)
    if to_date:
        filters.append(LeaveRequest.start_date <= to_date)

    total = db.scalar(select(func.count()).select_from(LeaveRequest).where(*filters))

    column = SORT_COLUMNS[sort_by]
    order = column.desc() if sort_order == "desc" else column.asc()
    stmt = (
        select(LeaveRequest)
        .options(*_with_relations())
        .where(*filters)
        .order_by(order, LeaveRequest.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(db.scalars(stmt)), total