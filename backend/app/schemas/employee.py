from datetime import date, datetime
from typing import Annotated, Literal, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

from app.schemas.department import DepartmentRef
from app.schemas.designation import DesignationRef

PersonName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]
EmployeeCode = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, to_upper=True, pattern=r"^[A-Za-z0-9-]{3,20}$"
    ),
]
Phone = Annotated[
    str, StringConstraints(strip_whitespace=True, pattern=r"^\+?[0-9]{7,15}$")
]

class EmployeeBase(BaseModel):
    first_name: PersonName
    last_name: PersonName
    email: EmailStr
    phone: Optional[Phone] = None
    department_id: int
    designation_id: int
    joining_date: date

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower()

class EmployeeCreate(EmployeeBase):
    employee_code: EmployeeCode
    status: Literal["Active", "Inactive"] = "Active"
    termination_date: Optional[date] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return v

    @model_validator(mode="after")
    def check_status_and_dates(self):
        if self.status == "Active" and self.termination_date is not None:
            raise ValueError("termination_date must be empty for an Active employee")
        if self.termination_date and self.termination_date < self.joining_date:
            raise ValueError("termination_date cannot be before joining_date")
        return self

class EmployeeUpdate(EmployeeBase):
    pass

class EmployeeStatusUpdate(BaseModel):
    status: Literal["Active", "Inactive"]

class EmployeeSelfUpdate(BaseModel):
    phone: Optional[Phone] = None

class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    joining_date: date
    termination_date: Optional[date]
    status: str
    user_id: Optional[int]
    department: DepartmentRef
    designation: DesignationRef
    created_at: datetime