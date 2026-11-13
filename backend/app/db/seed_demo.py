import random
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import Department, Designation, Employee, LeaveRequest, User

random.seed(42)  # same data every run

ORG = {
    "Engineering": ["Backend Developer", "Frontend Developer", "QA Engineer"],
    "Human Resources": ["HR Executive", "Recruiter"],
    "Finance": ["Accountant", "Financial Analyst"],
    "Marketing": ["Marketing Executive", "Content Writer"],
    "Sales": ["Sales Executive", "Account Manager"],
}
FIRST_NAMES = [
    "Arun", "Bhavana", "Chitra", "Dinesh", "Eswari", "Faisal", "Gayathri",
    "Harish", "Indira", "Jegan", "Kavitha", "Lokesh", "Mythili", "Naveen",
    "Oviya", "Prakash", "Revathi", "Sathish", "Tamilselvi", "Udhay",
]
LAST_NAMES = [
    "Murugan", "Pandian", "Selvam", "Iyer", "Nair",
    "Reddy", "Sharma", "Das", "Menon", "Gopal",
]
LEAVE_TYPES = ["Annual", "Sick", "Casual", "Unpaid"]
EMPLOYEE_COUNT = 40


def _get_or_create_department(db: Session, name: str) -> Department:
    dept = db.scalar(select(Department).where(Department.name == name))
    if not dept:
        dept = Department(name=name, description=f"{name} department")
        db.add(dept)
        db.flush()
    return dept


def _get_or_create_designation(db: Session, name: str, dept: Department) -> Designation:
    desig = db.scalar(
        select(Designation).where(
            Designation.name == name, Designation.department_id == dept.id
        )
    )
    if not desig:
        desig = Designation(name=name, department_id=dept.id)
        db.add(desig)
        db.flush()
    return desig


def seed_demo() -> None:
    db = SessionLocal()
    try:
        today = date.today()

        designations: dict[tuple[str, str], Designation] = {}
        departments: dict[str, Department] = {}
        for dept_name, titles in ORG.items():
            dept = _get_or_create_department(db, dept_name)
            departments[dept_name] = dept
            for title in titles:
                designations[(dept_name, title)] = _get_or_create_designation(db, title, dept)

        admin = db.scalar(select(User).where(User.email == "admin@example.com"))
        dept_names = list(ORG)
        created: list[Employee] = []

        for i in range(1, EMPLOYEE_COUNT + 1):
            code = f"EMP{100 + i}"
            first = FIRST_NAMES[i % len(FIRST_NAMES)]
            last = LAST_NAMES[(i * 3) % len(LAST_NAMES)]
            dept_name = dept_names[i % len(dept_names)]
            title = random.choice(ORG[dept_name])
            joining = today - timedelta(days=random.randint(0, 420))
            phone = f"9{random.randint(100000000, 999999999)}"
            leaves_after = random.random() < 0.15
            tenure = random.randint(60, 300)

            if db.scalar(select(Employee.id).where(Employee.employee_code == code)):
                continue  # already seeded

            status, termination = "Active", None
            if leaves_after and joining + timedelta(days=tenure) <= today:
                status, termination = "Inactive", joining + timedelta(days=tenure)

            emp = Employee(
                employee_code=code,
                first_name=first,
                last_name=last,
                email=f"{first}.{last}.{100 + i}@demo.example.com".lower(),
                phone=phone,
                department_id=departments[dept_name].id,
                designation_id=designations[(dept_name, title)].id,
                joining_date=joining,
                termination_date=termination,
                status=status,
            )
            db.add(emp)
            created.append(emp)

        db.flush()

        # Leaves only for newly created, long-serving, active employees
        eligible = [
            e for e in created
            if e.status == "Active" and e.joining_date < today - timedelta(days=100)
        ]
        plans = [
            ("Approved", -1, 2), ("Approved", 0, 1), ("Approved", -2, 3),
            ("Approved", -1, 1), ("Approved", 0, 4),          # these cover today
            ("Approved", -45, -43), ("Approved", -30, -28), ("Approved", -75, -71),
            ("Pending", 10, 12), ("Pending", 20, 20),
            ("Rejected", 5, 6), ("Rejected", -15, -14),
        ]
        for emp, (status, start_off, end_off) in zip(eligible, plans):
            reviewed = status != "Pending"
            db.add(
                LeaveRequest(
                    employee_id=emp.id,
                    leave_type=random.choice(LEAVE_TYPES),
                    start_date=today + timedelta(days=start_off),
                    end_date=today + timedelta(days=end_off),
                    reason="Demo leave request",
                    status=status,
                    reviewer_id=admin.id if (reviewed and admin) else None,
                    reviewed_at=datetime.now() if reviewed else None,
                )
            )

        db.commit()
        print(f"Seeded {len(created)} employees")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo()