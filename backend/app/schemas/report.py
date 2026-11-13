from datetime import date
from typing import Optional

from pydantic import BaseModel


class SummaryOut(BaseModel):
    as_of: date
    department_id: Optional[int]
    total_employees: int
    active_employees: int
    inactive_employees: int
    departments: int
    on_leave: int


class DepartmentCount(BaseModel):
    department_id: int
    department: str
    employee_count: int


class DepartmentDistributionOut(BaseModel):
    total: int
    items: list[DepartmentCount]


class MonthlyTrendPoint(BaseModel):
    month: str  # "2026-03"
    joiners: int
    leavers: int


class MonthlyTrendsOut(BaseModel):
    date_from: date
    date_to: date
    items: list[MonthlyTrendPoint]