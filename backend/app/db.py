from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .config import settings


def build_database_url() -> str:
    return (
        f"postgresql+psycopg://{settings.db_user}:{settings.db_password}"
        f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
        f"?sslmode={settings.db_sslmode}"
    )


engine = create_engine(build_database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
