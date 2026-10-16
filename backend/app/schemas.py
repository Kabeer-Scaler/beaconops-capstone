from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

IncidentStatus = Literal["DETECTED", "INVESTIGATING", "MONITORING", "RESOLVED"]
IncidentSeverity = Literal["SEV1", "SEV2", "SEV3", "SEV4"]


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    summary: str = Field(default="", max_length=4000)
    severity: IncidentSeverity = "SEV3"
    status: IncidentStatus = "DETECTED"
    service: str = Field(min_length=2, max_length=120)
    commander: str = Field(default="Unassigned", min_length=2, max_length=120)


class IncidentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    summary: str | None = Field(default=None, max_length=4000)
    severity: IncidentSeverity | None = None
    status: IncidentStatus | None = None
    service: str | None = Field(default=None, min_length=2, max_length=120)
    commander: str | None = Field(default=None, min_length=2, max_length=120)


class IncidentOut(IncidentCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentStats(BaseModel):
    total: int
    active: int
    critical: int
    resolved: int
    mean_time_to_resolve_minutes: int
