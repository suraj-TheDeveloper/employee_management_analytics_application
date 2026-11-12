from datetime import datetime
from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]


class DepartmentCreate(BaseModel):
    name: Name
    description: Optional[str] = Field(default=None, max_length=255)


class DepartmentUpdate(BaseModel):
    name: Name
    description: Optional[str] = Field(default=None, max_length=255)
    is_active: bool


class DepartmentRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime