# tests/test_integrity.py
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.core.errors import DomainError

def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "Smart Farming ERP API" in r.json()["app"]

def test_rbac_penerimaan_cannot_change_sales_price(client, auth_headers):
    pen = auth_headers("penerimaan")
    r = client.post(
        "/api/v1/master/sales-prices",
        headers=pen,
        json={
            "product_id": 1,
            "grade_id": 1,
            "segment": "RETAIL",
            "price": 50000,
            "valid_from": "2026-11-14",
        },
    )
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "FORBIDDEN"

def test_login_invalid_credentials(client):
    r = client.post("/api/v1/auth/login", json={"username": "nonexistent", "password": "wrong"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "INVALID_CREDENTIALS"

