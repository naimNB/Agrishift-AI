from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Database Engine — Supports SQLite (local development) and PostgreSQL (cloud production)
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # Automatically tests connection vitality before execution
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — DB session inject করে, শেষে close করে।"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """App start হলে সব table auto-create হবে।"""
    from app.models import user, farm  # noqa: F401 — import করলেই table register হয়
    Base.metadata.create_all(bind=engine)


def check_database_health() -> bool:
    """Verifies database connectivity with a lightweight query."""
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
