import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = os.getenv(
        "APP_NAME",
        "Crypto AI backend"
    )

    APP_ENV: str = os.getenv(
        "APP_ENV",
        "development"
    )

    DEBUG: bool = os.getenv(
    "DEBUG",
    "false"
    ).lower() == "true"

    DATABASE_URL = os.getenv(
        "DATABASE_URL"
    )

    JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    )

    JWT_ALGORITHM = os.getenv(
        "JWT_ALGORITHM",
        "HS256"
    )
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES : int = int(
        os.getenv(
            "JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
            "30"
        )
    )

settings = Settings()