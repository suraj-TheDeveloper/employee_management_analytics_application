from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Role, User

ROLES = {
    "Admin": "Manage users and roles; full access to all modules and analytics",
    "HR": "Manage employees, departments and leave requests; view analytics",
    "Employee": "View own profile and leave history; submit leave requests",
}

# DEV ONLY: never use these credentials outside local development.
DEV_USERS = [
    ("admin@example.com", "Admin@123", "Admin"),
    ("hr@example.com", "Hr@12345", "HR"),
]


def seed() -> None:
    db = SessionLocal()
    try:
        for name, description in ROLES.items():
            role = db.scalar(select(Role).where(Role.name == name))
            if not role:
                db.add(Role(name=name, description=description))
            elif role.description is None:
                role.description = description
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