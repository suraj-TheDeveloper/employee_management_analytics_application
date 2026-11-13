from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.repositories import department_repository, report_repository
from app.schemas.report import (
    DepartmentCount,
    DepartmentDistributionOut,
    MonthlyTrendPoint,
    MonthlyTrendsOut,
    SummaryOut,
)

MAX_TREND_MONTHS = 60


def _check_department(db: Session, department_id: Optional[int]) -> None:
    if department_id is not None and not department_repository.get_by_id(
        db, department_id
    ):
        raise NotFoundError("Department not found")


def get_summary(
    db: Session, on_date: Optional[date], department_id: Optional[int]
) -> SummaryOut:
    _check_department(db, department_id)
    as_of = on_date or date.today()
    total, active, inactive = report_repository.employee_counts(db, department_id)
    return SummaryOut(
        as_of=as_of,
        department_id=department_id,
        total_employees=total,
        active_employees=active,
        inactive_employees=inactive,
        departments=report_repository.count_departments(db, department_id),
        on_leave=report_repository.count_on_leave(db, as_of, department_id),
    )


def get_department_distribution(
    db: Session, status: Optional[str]
) -> DepartmentDistributionOut:
    rows = report_repository.department_distribution(db, status)
    items = [DepartmentCount(department_id=i, department=n, employee_count=c) for i, n, c in rows]
    return DepartmentDistributionOut(
        total=sum(item.employee_count for item in items), items=items
    )


def _default_from(end: date) -> date:
    """First day of the month 11 months before `end`'s month (a 12-month window)."""
    index = end.year * 12 + (end.month - 1) - 11
    year, month0 = divmod(index, 12)
    return date(year, month0 + 1, 1)


def _months(start: date, end: date):
    year, month = start.year, start.month
    while (year, month) <= (end.year, end.month):
        yield year, month
        month += 1
        if month == 13:
            year, month = year + 1, 1


def get_monthly_trends(
    db: Session,
    date_from: Optional[date],
    date_to: Optional[date],
    department_id: Optional[int],
) -> MonthlyTrendsOut:
    _check_department(db, department_id)
    date_to = date_to or date.today()
    date_from = date_from or _default_from(date_to)

    if date_from > date_to:
        raise BusinessRuleError("date_from must not be after date_to")
    months = list(_months(date_from, date_to))
    if len(months) > MAX_TREND_MONTHS:
        raise BusinessRuleError(f"The range cannot exceed {MAX_TREND_MONTHS} months")

    joiners = report_repository.joiners_by_month(db, date_from, date_to, department_id)
    leavers = report_repository.leavers_by_month(db, date_from, date_to, department_id)

    items = [
        MonthlyTrendPoint(
            month=f"{y}-{m:02d}",
            joiners=joiners.get((y, m), 0),
            leavers=leavers.get((y, m), 0),
        )
        for y, m in months
    ]
    return MonthlyTrendsOut(date_from=date_from, date_to=date_to, items=items)