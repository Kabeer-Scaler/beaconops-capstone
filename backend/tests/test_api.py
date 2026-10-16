from fastapi.testclient import TestClient


def create_incident(client: TestClient, payload: dict[str, str]) -> dict:
    response = client.post("/api/incidents", json=payload)
    assert response.status_code == 201
    return response.json()


def test_health_and_readiness(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "UP"}
    assert client.get("/ready").json() == {"status": "READY"}


def test_create_and_get_incident(client: TestClient, incident_payload: dict[str, str]) -> None:
    created = create_incident(client, incident_payload)
    response = client.get(f"/api/incidents/{created['id']}")
    assert response.status_code == 200
    assert response.json()["service"] == "checkout-api"


def test_list_and_filter_incidents(client: TestClient, incident_payload: dict[str, str]) -> None:
    create_incident(client, incident_payload)
    second = {**incident_payload, "title": "Search errors", "severity": "SEV1"}
    create_incident(client, second)
    response = client.get("/api/incidents", params={"severity": "SEV1"})
    assert response.status_code == 200
    assert [item["title"] for item in response.json()] == ["Search errors"]


def test_update_incident(client: TestClient, incident_payload: dict[str, str]) -> None:
    created = create_incident(client, incident_payload)
    response = client.put(
        f"/api/incidents/{created['id']}",
        json={"status": "INVESTIGATING", "commander": "Mira Patel"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "INVESTIGATING"
    assert response.json()["commander"] == "Mira Patel"


def test_delete_incident(client: TestClient, incident_payload: dict[str, str]) -> None:
    created = create_incident(client, incident_payload)
    assert client.delete(f"/api/incidents/{created['id']}").status_code == 204
    assert client.get(f"/api/incidents/{created['id']}").status_code == 404


def test_stats(client: TestClient, incident_payload: dict[str, str]) -> None:
    create_incident(client, {**incident_payload, "severity": "SEV1"})
    create_incident(client, {**incident_payload, "title": "Recovered", "status": "RESOLVED"})
    stats = client.get("/api/incidents/stats")
    assert stats.status_code == 200
    assert stats.json()["total"] == 2
    assert stats.json()["active"] == 1
    assert stats.json()["critical"] == 1
    assert stats.json()["resolved"] == 1


def test_validation_and_not_found(client: TestClient) -> None:
    assert client.post("/api/incidents", json={"title": "x"}).status_code == 422
    assert client.put("/api/incidents/999", json={"status": "RESOLVED"}).status_code == 404
    assert client.delete("/api/incidents/999").status_code == 404


def test_metrics_exposed(client: TestClient) -> None:
    client.get("/")
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text
