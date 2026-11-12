from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError


def commit_or_conflict(db: Session, message: str) -> None:
    """Commit; if the database rejects it (e.g. UNIQUE violation), return 409."""
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(message)