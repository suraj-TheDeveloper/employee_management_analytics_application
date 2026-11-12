from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.designation import DesignationCreate, DesignationOut, DesignationUpdate
from app.services import designation_service

router = APIRouter(prefix="/designations", tags=["Designations"])

manage_roles = require_roles("Admin", "HR")


@router.get("", response_model=Page[DesignationOut])
def list_designations(
    search: Optional[str] = Query(None, max_length=100),
    department_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    sort_by: Literal["name", "created_at"] = "name",
    sort_order: Literal["asc", "desc"] = "asc",
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items, total = designation_service.list_designations(
        db,
        search=search,
        department_id=department_id,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return Page(
        items=[DesignationOut.model_validate(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{designation_id}", response_model=DesignationOut)
def get_designation(
    designation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return designation_service.get_designation(db, designation_id)


@router.post("", response_model=DesignationOut, status_code=status.HTTP_201_CREATED)
def create_designation(
    data: DesignationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(manage_roles),
):
    return designation_service.create_designation(db, data)


@router.put("/{designation_id}", response_model=DesignationOut)
def update_designation(
    designation_id: int,
    data: DesignationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(manage_roles),
):
    return designation_service.update_designation(db, designation_id, data)