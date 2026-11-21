"""Tests for app/api/v1/users.py."""

from httpx import AsyncClient

ME = "/api/v1/users/me"


async def test_me_with_cookie(logged_in_client: AsyncClient, user: dict[str, str]) -> None:
    response = await logged_in_client.get(ME)

    assert response.status_code == 200
    assert response.json()["email"] == user["email"]


async def test_me_without_cookie(client: AsyncClient) -> None:
    response = await client.get(ME)

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_me_with_bad_token(client: AsyncClient) -> None:
    client.cookies.set("access_token", "not-a-real-token")

    response = await client.get(ME)

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"
