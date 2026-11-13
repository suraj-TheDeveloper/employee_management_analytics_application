from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.user import (
    RoleDetailOut,
    UserAdminOut,
    UserCreate,
    UserRoleUpdate,
    UserStatusUpdate,
)
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])
roles_router = APIRouter(prefix="/roles", tags=["Roles"])

admin_only = require_roles("Admin")


@roles_router.get("", response_model=list[RoleDetailOut])
def list_roles(db: Session = Depends(get_db), _: User = Depends(admin_only)):
    return user_service.list_roles(db)


@router.get("", response_model=Page[UserAdminOut])
def list_users(
    search: Optional[str] = Query(None, max_length=100),
    role_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    sort_by: Literal["email", "created_at"] = "email",
    sort_order: Literal["asc", "desc"] = "asc",
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(admin_only),
):
    items, total = user_service.list_users(
        db,
        search=search,
        role_id=role_id,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return Page(
        items=[UserAdminOut.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=UserAdminOut, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only),
):
    return user_service.create_user(db, data, admin)


@router.patch("/{user_id}/status", response_model=UserAdminOut)
def set_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only),
):
    return user_service.set_status(db, user_id, data.is_active, admin)


@router.patch("/{user_id}/role", response_model=UserAdminOut)
def set_user_role(
    user_id: int,
    data: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only),
):
    return user_service.set_role(db, user_id, data.role_id, admin)