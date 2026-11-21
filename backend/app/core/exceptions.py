"""Domain errors raised by services. They say *what* went wrong, not which HTTP
status it maps to; that mapping lives in app/api/errors.py."""


class AppError(Exception):
    code = "APP_ERROR"
    message = "Something went wrong."

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.message
        super().__init__(self.message)


class NotAuthenticated(AppError):
    code = "NOT_AUTHENTICATED"
    message = "Not authenticated."


class InvalidCredentials(AppError):
    code = "INVALID_CREDENTIALS"
    message = "Invalid email or password."


class IncorrectPassword(AppError):
    code = "INCORRECT_PASSWORD"
    message = "Incorrect password."


class UserAlreadyExists(AppError):
    code = "USER_EXISTS"
    message = "User already exists. Please login."
