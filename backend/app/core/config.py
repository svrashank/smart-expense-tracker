from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parents[3] / ".env"

class Settings(BaseSettings):
    """
    Base class for settings 
    """
    model_config = SettingsConfigDict(env_file=ENV_PATH, env_file_encoding="utf-8")
    POSTGRES_USER :str
    POSTGRES_PASSWORD :str
    POSTGRES_DB:str
    POSTGRES_SERVER:str
    POSTGRES_PORT:int
    DATABASE_URL:str
    ALGORITHM :str
    SCHEME :str
    FRONTEND_PORT :int
    BACKEND_PORT :int
    JWT_SECRET_KEY :str
    EXPIRES_DELTA :int
    LOG_SQL:bool


settings = Settings()
