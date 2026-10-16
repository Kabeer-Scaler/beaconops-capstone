from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import case, func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import Incident
from .schemas import IncidentCreate, IncidentOut, IncidentStats, IncidentUpdate


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Incident coordination API for production operations teams.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
Instrumentator(excluded_handlers=["/health", "/ready", "/metrics"]).instrument(app).expose(
    app, endpoint="/metrics", include_in_schema=False
)


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    return {"service": settings.app_name, "version": "1.0.0", "docs": "/docs"}


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "UP"}


@app.get("/ready", tags=["system"])
def ready(db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable") from exc
    return {"status": "READY"}


@app.get("/api/incidents", response_model=list[IncidentOut], tags=["incidents"])
def list_incidents(
    incident_status: str | None = None,
    severity: str | None = None,
    db: Session = Depends(get_db),
) -> list[Incident]:
    query = select(Incident)
    if incident_status:
        query = query.where(Incident.status == incident_status)
    if severity:
        query = query.where(Incident.severity == severity)
    return list(db.scalars(query.order_by(Incident.created_at.desc(), Incident.id.desc())))


@app.get("/api/incidents/stats", response_model=IncidentStats, tags=["incidents"])
def incident_stats(db: Session = Depends(get_db)) -> IncidentStats:
    total, active, critical, resolved = db.execute(
        select(
            func.count(Incident.id),
            func.sum(case((Incident.status != "RESOLVED", 1), else_=0)),
            func.sum(case(((Incident.severity == "SEV1") & (Incident.status != "RESOLVED"), 1), else_=0)),
            func.sum(case((Incident.status == "RESOLVED", 1), else_=0)),
        )
    ).one()
    resolved_timestamps = db.execute(
        select(Incident.created_at, Incident.updated_at).where(Incident.status == "RESOLVED")
    ).all()
    durations = [
        max(0, (updated_at - created_at).total_seconds() / 60)
        for created_at, updated_at in resolved_timestamps
    ]
    return IncidentStats(
        total=total or 0,
        active=active or 0,
        critical=critical or 0,
        resolved=resolved or 0,
        mean_time_to_resolve_minutes=round(sum(durations) / len(durations)) if durations else 0,
    )


@app.get("/api/incidents/{incident_id}", response_model=IncidentOut, tags=["incidents"])
def get_incident(incident_id: int, db: Session = Depends(get_db)) -> Incident:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return incident


@app.post(
    "/api/incidents",
    response_model=IncidentOut,
    status_code=status.HTTP_201_CREATED,
    tags=["incidents"],
)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)) -> Incident:
    incident = Incident(**payload.model_dump())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@app.put("/api/incidents/{incident_id}", response_model=IncidentOut, tags=["incidents"])
def update_incident(
    incident_id: int, payload: IncidentUpdate, db: Session = Depends(get_db)
) -> Incident:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(incident, key, value)
    db.commit()
    db.refresh(incident)
    return incident


@app.delete(
    "/api/incidents/{incident_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["incidents"]
)
def delete_incident(incident_id: int, db: Session = Depends(get_db)) -> Response:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    db.delete(incident)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
