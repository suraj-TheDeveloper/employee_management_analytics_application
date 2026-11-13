import logging

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.user import User
from app.repositories import user_repository
from app.schemas.user import UserCreate
from app.services.utils import commit_or_conflict

logger = logging.getLogger("app.users")

DUPLICATE_MSG = "A user with this email already exists"


def list_roles(db: Session):
    return user_repository.list_roles(db)


def list_users(db: Session, **query):
    return user_repository.list_users(db, **query)


def get_user(db: Session, user_id: int) -> User:
    user = user_repository.get_with_role(db, user_id)
    if not user:
        raise NotFoundError("User not found")
    return user


def _get_role(db: Session, role_id: int):
    role = user_repository.get_role_by_id(db, role_id)
    if not role:
        raise NotFoundError("Role not found")
    return role


def create_user(db: Session, data: UserCreate, actor: User) -> User:
    role = _get_role(db, data.role_id)
    if user_repository.get_by_email(db, data.email):
        raise ConflictError(DUPLICATE_MSG)

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role_id=role.id,
    )
    db.add(user)
    commit_or_conflict(db, DUPLICATE_MSG)
    logger.info("user_created id=%s role=%s by=%s", user.id, role.name, actor.id)
    return get_user(db, user.id)


def set_status(db: Session, user_id: int, is_active: bool, actor: User) -> User:
    user = get_user(db, user_id)

    if user.id == actor.id and not is_active:
        raise BusinessRuleError("You cannot deactivate your own account")
    if is_active and user.employee and user.employee.status == "Inactive":
        raise BusinessRuleError(
            "Cannot activate this user: the linked employee record is Inactive. "
            "Reactivate the employee instead."
        )

    user.is_active = is_active
    commit_or_conflict(db, "Could not update user status")
    logger.info("user_status_changed id=%s active=%s by=%s", user.id, is_active, actor.id)
    return get_user(db, user.id)


def set_role(db: Session, user_id: int, role_id: int, actor: User) -> User:
    user = get_user(db, user_id)
    role = _get_role(db, role_id)

    if user.id == actor.id:
        raise BusinessRuleError("You cannot change your own role")

    if user.role_id != role.id:
        user.role_id = role.id
        commit_or_conflict(db, "Could not update user role")
        logger.info("user_role_changed id=%s role=%s by=%s", user.id, role.name, actor.id)
    return get_user(db, user.id)