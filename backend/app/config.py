from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./agrishift.db"

    # JWT Auth
    SECRET_KEY: str = "change-this-to-a-strong-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # NASA POWER API (no key needed for basic access)
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"

    # North Bengal default coordinates
    # Rajshahi / Rangpur division coverage
    NORTH_BENGAL_LAT: float = 24.7471
    NORTH_BENGAL_LON: float = 90.3915

    class Config:
        env_file = ".env"


settings = Settings()
