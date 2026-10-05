"""
test_health_and_auth.py — Tests for System Health & Authentication Flow
========================================================================
Tests:
- Health check (/health) and Root (/) endpoints
- User registration (valid data & duplicate email prevention)
- User login (JWT issuance & invalid password rejection)
- Protected /api/auth/me endpoint (with valid and invalid JWTs)
"""

import pytest
from starlette.testclient import TestClient


def test_health_check_endpoint(client: TestClient):
    """Verifies that the /health endpoint returns HTTP 200 and status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_endpoint(client: TestClient):
    """Verifies that the root / endpoint returns HTTP 200 and API metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "AgriShift AI" in data["message"]
    assert "North Bengal" in data["region"]
    assert data["docs"] == "/docs"


def test_user_registration_success(client: TestClient):
    """Tests creating a new user account via POST /api/auth/register."""
    payload = {
        "name": "Mokhlesur Rahman",
        "email": "mokhlesur@example.com",
        "password": "SecretPassword123!",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "mokhlesur@example.com"
    assert data["name"] == "Mokhlesur Rahman"
    assert "id" in data
    assert "hashed_pw" not in data  # Ensure password hash is never leaked in response


def test_user_registration_duplicate_email(client: TestClient):
    """Prevents registering multiple accounts with identical emails."""
    payload = {
        "name": "Duplicate Farmer",
        "email": "duplicate@example.com",
        "password": "Password123!",
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "Email already registered" in res2.json()["detail"]


def test_user_login_success(client: TestClient):
    """Tests authenticating an existing user and receiving a valid JWT access token."""
    register_payload = {
        "name": "Anisul Islam",
        "email": "anisul@example.com",
        "password": "SecurePassword456!",
    }
    client.post("/api/auth/register", json=register_payload)

    login_payload = {
        "email": "anisul@example.com",
        "password": "SecurePassword456!",
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert len(data["access_token"]) > 20
    assert data.get("token_type") in ("bearer", None)


def test_user_login_invalid_password(client: TestClient):
    """Verifies that an incorrect password fails with 401 Unauthorized."""
    register_payload = {
        "name": "Tariqul",
        "email": "tariqul@example.com",
        "password": "CorrectPassword!",
    }
    client.post("/api/auth/register", json=register_payload)

    login_payload = {
        "email": "tariqul@example.com",
        "password": "WrongPassword!",
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_user_login_unregistered_email(client: TestClient):
    """Verifies that logging in with an unknown email fails with 401 Unauthorized."""
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "SomePassword!",
    })
    assert response.status_code == 401


def test_get_current_user_profile(client: TestClient):
    """Verifies that GET /api/auth/me retrieves current user profile with valid Bearer token."""
    user_data = {
        "name": "Begum Rokeya",
        "email": "rokeya@example.com",
        "password": "Password789!",
    }
    client.post("/api/auth/register", json=user_data)

    login_res = client.post("/api/auth/login", json={
        "email": user_data["email"],
        "password": user_data["password"],
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    profile = response.json()
    assert profile["email"] == user_data["email"]
    assert profile["name"] == user_data["name"]


def test_get_current_user_unauthorized(client: TestClient):
    """Verifies that GET /api/auth/me rejects requests without token or with malformed token."""
    # No token provided
    res1 = client.get("/api/auth/me")
    assert res1.status_code in (401, 403)

    # Invalid token provided
    res2 = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_garbage_token"})
    assert res2.status_code == 401
