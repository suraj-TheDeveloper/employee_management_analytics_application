from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.report import DepartmentDistributionOut, MonthlyTrendsOut, SummaryOut
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

analytics_roles = require_roles("Admin", "HR")


@router.get("/summary", response_model=SummaryOut)
def summary(
    on_date: Optional[date] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(analytics_roles),
):
    return report_service.get_summary(db, on_date, department_id)


@router.get("/department-distribution", response_model=DepartmentDistributionOut)
def department_distribution(
    status_filter: Optional[Literal["Active", "Inactive"]] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _: User = Depends(analytics_roles),
):
    return report_service.get_department_distribution(db, status_filter)


@router.get("/monthly-trends", response_model=MonthlyTrendsOut)
def monthly_trends(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(analytics_roles),
):
    return report_service.get_monthly_trends(db, date_from, date_to, department_id)