"""Turns domain errors into HTTP responses. Every handled error has the shape
{"code": "USER_EXISTS", "detail": "User already exists. Please login."}."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core import exceptions as exc

STATUS_CODES: dict[type[exc.AppError], int] = {
    exc.NotAuthenticated: status.HTTP_401_UNAUTHORIZED,
    exc.InvalidCredentials: status.HTTP_401_UNAUTHORIZED,
    exc.IncorrectPassword: status.HTTP_403_FORBIDDEN,
    exc.UserAlreadyExists: status.HTTP_409_CONFLICT,
}


async def app_error_handler(request: Request, error: Exception) -> JSONResponse:
    assert isinstance(error, exc.AppError)
    status_code = STATUS_CODES.get(type(error), status.HTTP_400_BAD_REQUEST)
    return JSONResponse(status_code=status_code, content={"code": error.code, "detail": error.message})


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(exc.AppError, app_error_handler)
