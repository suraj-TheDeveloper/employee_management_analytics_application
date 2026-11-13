from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.role import Role
from app.models.user import User

SORT_COLUMNS = {"email": User.email, "created_at": User.created_at}


def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.scalar(select(User).where(User.email == email))


def get_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)


def get_with_role(db: Session, user_id: int) -> Optional[User]:
    return db.scalar(
        select(User).options(joinedload(User.role)).where(User.id == user_id)
    )


def get_role_by_name(db: Session, name: str) -> Optional[Role]:
    return db.scalar(select(Role).where(Role.name == name))


def get_role_by_id(db: Session, role_id: int) -> Optional[Role]:
    return db.get(Role, role_id)


def list_roles(db: Session) -> list[Role]:
    return list(db.scalars(select(Role).order_by(Role.id)))


def list_users(
    db: Session,
    *,
    search: Optional[str],
    role_id: Optional[int],
    is_active: Optional[bool],
    sort_by: str,
    sort_order: str,
    page: int,
    page_size: int,
) -> tuple[list[User], int]:
    filters = []
    if search:
        filters.append(User.email.contains(search, autoescape=True))
    if role_id is not None:
        filters.append(User.role_id == role_id)
    if is_active is not None:
        filters.append(User.is_active == is_active)

    total = db.scalar(select(func.count()).select_from(User).where(*filters))

    column = SORT_COLUMNS[sort_by]
    order = column.desc() if sort_order == "desc" else column.asc()
    stmt = (
        select(User)
        .options(joinedload(User.role))
        .where(*filters)
        .order_by(order, User.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(db.scalars(stmt)), total