from datetime import date
from typing import Optional

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"
    __table_args__ = (
        CheckConstraint("status IN ('Active', 'Inactive')", name="ck_employee_status"),
        Index("ix_employees_status", "status"),
        Index("ix_employees_joining_date", "joining_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(20), unique=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), unique=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    designation_id: Mapped[int] = mapped_column(ForeignKey("designations.id"))
    joining_date: Mapped[date] = mapped_column(Date)
    termination_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="Active", server_default="Active")

    user: Mapped[Optional["User"]] = relationship(back_populates="employee")
    department: Mapped["Department"] = relationship(back_populates="employees")
    designation: Mapped["Designation"] = relationship(back_populates="employees")
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(back_populates="employee")