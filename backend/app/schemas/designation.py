from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.schemas.department import DepartmentRef

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]

class DesignationRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str

class DesignationCreate(BaseModel):
    name: Name
    department_id: int


class DesignationUpdate(BaseModel):
    name: Name
    department_id: int
    is_active: bool


class DesignationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    department_id: int
    is_active: bool
    created_at: datetime
    department: DepartmentRef