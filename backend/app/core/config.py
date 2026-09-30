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

settings = Settings()