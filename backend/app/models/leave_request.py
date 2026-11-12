from datetime import date, datetime
from typing import Optional

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class LeaveRequest(Base, TimestampMixin):
    __tablename__ = "leave_requests"
    __table_args__ = (
        CheckConstraint(
            "status IN ('Pending', 'Approved', 'Rejected')", name="ck_leave_status"
        ),
        CheckConstraint("end_date >= start_date", name="ck_leave_dates"),
        Index("ix_leave_requests_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    leave_type: Mapped[str] = mapped_column(String(30))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    reason: Mapped[Optional[str]] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default="Pending", server_default="Pending")
    reviewer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    reviewer_comment: Mapped[Optional[str]] = mapped_column(String(500))
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    employee: Mapped["Employee"] = relationship(back_populates="leave_requests")
    reviewer: Mapped[Optional["User"]] = relationship()