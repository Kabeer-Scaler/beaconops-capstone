import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

TEST_DATABASE_URL = "sqlite:///./beaconops-test.db"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["ENVIRONMENT"] = "test"

from app.db import Base, SessionLocal, engine, get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def clean_database() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def incident_payload() -> dict[str, str]:
    return {
        "title": "Checkout latency above SLO",
        "summary": "p95 latency exceeded 900 ms in ap-south-1.",
        "severity": "SEV2",
        "status": "DETECTED",
        "service": "checkout-api",
        "commander": "Aarav Sharma",
    }
