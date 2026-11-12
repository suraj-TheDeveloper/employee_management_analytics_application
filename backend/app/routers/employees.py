from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeOut,
    EmployeeStatusUpdate,
    EmployeeSelfUpdate,
    EmployeeUpdate,
)
from app.services import employee_service

router = APIRouter(prefix="/employees", tags=["Employees"])

manage_roles = require_roles("Admin", "HR")

@router.get("", response_model=Page[EmployeeOut])
def list_employees(
    search: Optional[str] = Query(None, max_length=100),
    department_id: Optional[int] = None,
    designation_id: Optional[int] = None,
    status_filter: Optional[Literal["Active", "Inactive"]] = Query(None, alias="status"),
    joined_from: Optional[date] = None,
    joined_to: Optional[date] = None,
    sort_by: Literal[
        "first_name", "last_name", "employee_code", "joining_date", "created_at"
    ] = "first_name",
    sort_order: Literal["asc", "desc"] = "asc",
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(manage_roles),
):
    items, total = employee_service.list_employees(
        db,
        search=search,
        department_id=department_id,
        designation_id=designation_id,
        status=status_filter,
        joined_from=joined_from,
        joined_to=joined_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return Page(
        items=[EmployeeOut.model_validate(e) for e in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# "/me" must be declared BEFORE "/{employee_id}", or "me" is parsed as an id
@router.patch("/me", response_model=EmployeeOut)
def update_my_contact(data: EmployeeSelfUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return employee_service.update_my_contact(db, current_user, data)


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return employee_service.get_employee_for_user(db, employee_id, current_user)


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(manage_roles),
):
    return employee_service.create_employee(db, data)


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(manage_roles),
):
    return employee_service.update_employee(db, employee_id, data)


@router.patch("/{employee_id}/status", response_model=EmployeeOut)
def change_employee_status(
    employee_id: int,
    data: EmployeeStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(manage_roles),
):
    return employee_service.change_status(db, employee_id, data.status)