from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Role, User

ROLES = ["Admin", "HR", "Employee"]

# DEV ONLY: never use these credentials outside local development.
DEV_USERS = [
    ("admin@example.com", "Admin@123", "Admin"),
    ("hr@example.com", "Hr@12345", "HR"),
]


def seed() -> None:
    db = SessionLocal()
    try:
        for name in ROLES:
            if not db.scalar(select(Role).where(Role.name == name)):
                db.add(Role(name=name))
        db.flush()

        for email, password, role_name in DEV_USERS:
            if not db.scalar(select(User).where(User.email == email)):
                role = db.scalar(select(Role).where(Role.name == role_name))
                db.add(
                    User(
                        email=email,
                        password_hash=hash_password(password),
                        role_id=role.id,
                    )
                )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed complete")