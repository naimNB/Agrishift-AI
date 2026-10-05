from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# SQLite (dev তে সহজ, production এ PostgreSQL দিতে পারো)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite এর জন্য দরকার
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
