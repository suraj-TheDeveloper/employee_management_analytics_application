from datetime import date, datetime
from typing import Annotated, Literal, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    computed_field,
    model_validator,
)

LeaveType = Literal["Annual", "Sick", "Casual", "Unpaid"]
LeaveStatus = Literal["Pending", "Approved", "Rejected"]

Reason = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=3, max_length=500)
]


class LeaveCreate(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Reason

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class LeaveReview(BaseModel):
    decision: Literal["Approved", "Rejected"]
    comment: Optional[str] = Field(default=None, max_length=500)


class EmployeeRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    first_name: str
    last_name: str


class ReviewerRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str


class LeaveOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee: EmployeeRef
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str]
    status: str
    reviewer: Optional[ReviewerRef]
    reviewer_comment: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime

    @computed_field
    @property
    def days(self) -> int:
        return (self.end_date - self.start_date).days + 1