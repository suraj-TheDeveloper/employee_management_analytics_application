from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.leave import LeaveCreate, LeaveOut, LeaveReview, LeaveStatus, LeaveType
from app.services import leave_service

router = APIRouter(prefix="/leaves", tags=["Leaves"])


@router.post("", response_model=LeaveOut, status_code=status.HTTP_201_CREATED)
def submit_leave(
    data: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return leave_service.create_leave(db, current_user, data)


@router.get("", response_model=Page[LeaveOut])
def list_leaves(
    employee_id: Optional[int] = None,
    status_filter: Optional[LeaveStatus] = Query(None, alias="status"),
    leave_type: Optional[LeaveType] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    sort_by: Literal["created_at", "start_date", "end_date"] = "created_at",
    sort_order: Literal["asc", "desc"] = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = leave_service.list_leaves(
        db,
        current_user,
        employee_id=employee_id,
        status=status_filter,
        leave_type=leave_type,
        from_date=from_date,
        to_date=to_date,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return Page(
        items=[LeaveOut.model_validate(x) for x in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{leave_id}", response_model=LeaveOut)
def get_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return leave_service.get_leave_for_user(db, leave_id, current_user)


@router.patch("/{leave_id}/review", response_model=LeaveOut)
def review_leave(
    leave_id: int,
    data: LeaveReview,
    db: Session = Depends(get_db),
    reviewer: User = Depends(require_roles("Admin", "HR")),
):
    return leave_service.review_leave(db, leave_id, reviewer, data) 