"""Shared test setup. pytest loads this file automatically before any test.

What it does, in order:
1. Points the app at the test database instead of the dev one (get_db swap).
2. Creates all tables once before the test run, drops them after.
3. Empties every table after each test, so tests can't affect each other.
4. Provides fixtures tests can ask for by name: `client`, `user`, `logged_in_client`.
"""

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.api.deps import get_db
from app.core.config import settings
from app.main import app
from app.models import Base

TEST_DATABASE_URL = settings.TEST_DATABASE_URL

# Safety checks: never let the tests run against the dev database,
# because step 3 deletes every row.
if not TEST_DATABASE_URL:
    pytest.exit("TEST_DATABASE_URL is not set in .env", returncode=1)
if TEST_DATABASE_URL == settings.DATABASE_URL:
    pytest.exit("TEST_DATABASE_URL must not be the same as DATABASE_URL", returncode=1)

LOG_SQL = settings.LOG_SQL
# For async: must use asyncpg and postgresql+asyncpg
test_engine = create_async_engine(TEST_DATABASE_URL, echo=LOG_SQL)

test_async_session = sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_test_db() -> AsyncGenerator[AsyncSession, None]:
    async with test_async_session() as session:
        yield session


# 1. Every route that asks for get_db now gets get_test_db instead.
app.dependency_overrides[get_db] = get_test_db


# 2. Create the tables once for the whole test run, drop them at the end.
#    scope="session" means "run once per pytest run", not once per test.
#    autouse=True means every test gets it without asking.
@pytest.fixture(scope="session", autouse=True)
async def create_tables() -> AsyncGenerator[None, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)  # clean up if a previous run crashed
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


# 3. After each test, delete every row so the next test starts empty.
@pytest.fixture(autouse=True)
async def empty_tables() -> AsyncGenerator[None, None]:
    yield
    table_names = ", ".join(f'"{table.name}"' for table in Base.metadata.sorted_tables)
    async with test_engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {table_names} RESTART IDENTITY CASCADE"))


# 4. Fixtures that tests ask for by naming them as parameters.


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """A fake browser that sends requests straight to the app, with no real server.

    The base URL is https because the auth cookie is marked Secure, and a
    Secure cookie is only sent back over https. Over http, the login would
    work but the next request would arrive without the cookie.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://test") as c:
        yield c


TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "correct-horse-battery"


@pytest.fixture
async def user(client: AsyncClient) -> dict[str, str]:
    """An account that already exists. Returns its email and password."""
    response = await client.post(
        "/api/v1/auth/signup", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 201, response.text
    return {"email": TEST_EMAIL, "password": TEST_PASSWORD}


@pytest.fixture
async def logged_in_client(client: AsyncClient, user: dict[str, str]) -> AsyncClient:
    """The same client, after logging in. Its cookie jar holds the auth cookie."""
    response = await client.post(
        "/api/v1/auth/login", data={"username": user["email"], "password": user["password"]}
    )
    assert response.status_code == 200, response.text
    return client
