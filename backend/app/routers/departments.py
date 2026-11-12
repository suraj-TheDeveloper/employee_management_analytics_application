from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.department import DepartmentCreate, DepartmentOut, DepartmentUpdate
from app.services import department_service

router = APIRouter(prefix="/departments", tags=["Departments"])

manage_roles = require_roles("Admin", "HR")


@router.get("", response_model=Page[DepartmentOut])
def list_departments(
    search: Optional[str] = Query(None, max_length=100),
    is_active: Optional[bool] = None,
    sort_by: Literal["name", "created_at"] = "name",
    sort_order: Literal["asc", "desc"] = "asc",
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items, total = department_service.list_departments(
        db,
        search=search,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return Page(
        items=[DepartmentOut.model_validate(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{department_id}", response_model=DepartmentOut)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return department_service.get_department(db, department_id)


@router.post("", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(manage_roles),
):
    return department_service.create_department(db, data)


@router.put("/{department_id}", response_model=DepartmentOut)
def update_department(
    department_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(manage_roles),
):
    return department_service.update_department(db, department_id, data)