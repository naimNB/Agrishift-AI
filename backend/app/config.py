import os
import warnings
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent

INSECURE_DEFAULT_KEYS = {
    "change-this-to-a-strong-secret-in-production",
    "agrishift-super-secret-key-change-in-production-2024",
    "secret",
    "secretkey",
    "default",
    "",
}


class Settings(BaseSettings):
    # Application Environment: 'development', 'testing', or 'production'
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR / 'agrishift.db'}"

    # JWT Authentication
    SECRET_KEY: str = "change-this-to-a-strong-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # NASA POWER API (public access for AG community)
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"

    # North Bengal default coordinates (Bogura agricultural center)
    NORTH_BENGAL_LAT: float = 24.8465
    NORTH_BENGAL_LON: float = 89.3773

    model_config = SettingsConfigDict(
        env_file=(
            str(BACKEND_DIR / ".env"),
            str(ROOT_DIR / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def validate_security(self) -> None:
        """
        Validate critical security parameters depending on environment mode.
        Prevents insecure defaults from ever being deployed to production.
        """
        env_mode = self.ENVIRONMENT.lower().strip()
        key = self.SECRET_KEY.strip()

        if env_mode == "production":
            if key in INSECURE_DEFAULT_KEYS or len(key) < 32:
                raise ValueError(
                    "CRITICAL SECURITY FAILURE: Production environment requires a strong, random "
                    "SECRET_KEY of at least 32 characters. Do not use default or placeholder keys."
                )
        elif key in INSECURE_DEFAULT_KEYS:
            warnings.warn(
                "SECURITY WARNING: AgriShift backend is running with a default or insecure SECRET_KEY. "
                "Set a secure SECRET_KEY in your .env before deploying to production.",
                stacklevel=2,
            )


settings = Settings()
settings.validate_security()

