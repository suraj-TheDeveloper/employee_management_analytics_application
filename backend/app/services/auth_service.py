from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.user import User
from app.repositories import user_repository


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = user_repository.get_by_email(db, email.strip().lower())
    if not user or not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user