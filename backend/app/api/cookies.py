"""The auth cookie, defined once. Setting, clearing and reading it all use the
same name and flags, so logout can never miss the cookie that login set."""

from typing import Annotated

from fastapi import Cookie, Response

from app.core.config import settings

AUTH_COOKIE = "access_token"
COOKIE_PATH = "/"
COOKIE_SECURE = True
COOKIE_SAMESITE = "lax"

# Route/dependency parameter type: the cookie's value, or None if absent.
AuthCookie = Annotated[str | None, Cookie(alias=AUTH_COOKIE)]


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE,
        value=token,
        max_age=settings.EXPIRES_DELTA * 60,
        path=COOKIE_PATH,
        secure=COOKIE_SECURE,
        httponly=True,
        samesite=COOKIE_SAMESITE,
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE,
        path=COOKIE_PATH,
        secure=COOKIE_SECURE,
        httponly=True,
        samesite=COOKIE_SAMESITE,
    )
