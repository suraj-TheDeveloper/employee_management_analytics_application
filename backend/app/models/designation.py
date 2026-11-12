from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Designation(Base, TimestampMixin):
    __tablename__ = "designations"
    __table_args__ = (
        UniqueConstraint("name", "department_id", name="uq_designation_name_department"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())

    department: Mapped["Department"] = relationship(back_populates="designations")
    employees: Mapped[list["Employee"]] = relationship(back_populates="designation")