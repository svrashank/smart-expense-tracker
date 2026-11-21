"""Tests for app/api/v1/auth.py: signup, login, logout."""

from httpx import AsyncClient

SIGNUP = "/api/v1/auth/signup"
LOGIN = "/api/v1/auth/login"
LOGOUT = "/api/v1/auth/logout"


async def test_signup_creates_user(client: AsyncClient) -> None:
    response = await client.post(SIGNUP, json={"email": "new@example.com", "password": "pw-12345"})

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new@example.com"
    assert "id" in body
    assert "password" not in body
    assert "password_hash" not in body


async def test_signup_duplicate_email(client: AsyncClient, user: dict[str, str]) -> None:
    response = await client.post(SIGNUP, json={"email": user["email"], "password": "other-pw"})

    assert response.status_code == 409
    assert response.json()["code"] == "USER_EXISTS"


async def test_login_sets_cookie(client: AsyncClient, user: dict[str, str]) -> None:
    response = await client.post(
        LOGIN, data={"username": user["email"], "password": user["password"]}
    )

    assert response.status_code == 200
    assert "access_token" in response.cookies
    # The token must only travel in the httponly cookie, never in the body.
    assert "access_token" not in response.json()


async def test_login_wrong_password(client: AsyncClient, user: dict[str, str]) -> None:
    response = await client.post(LOGIN, data={"username": user["email"], "password": "wrong"})

    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"
    assert "access_token" not in response.cookies


async def test_login_unknown_user(client: AsyncClient) -> None:
    response = await client.post(LOGIN, data={"username": "nobody@example.com", "password": "pw"})

    # Same error as a wrong password, so attackers can't find out which emails exist.
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"


async def test_logout_clears_cookie(logged_in_client: AsyncClient) -> None:
    response = await logged_in_client.post(LOGOUT)

    assert response.status_code == 200
    me = await logged_in_client.get("/api/v1/users/me")
    assert me.status_code == 401
