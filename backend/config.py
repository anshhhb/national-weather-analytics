import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).parent

load_dotenv(BASE_DIR / ".env")


SOURCE_MODE = os.getenv("WEATHER_SOURCE_MODE", "development_fixture")

DEFAULT_PAGE_SIZE = 20

IMD_API_BASE_URL = os.getenv("IMD_API_BASE_URL", "")

DATA_FILE = BASE_DIR / "data" / "weather_reports.json"


EVENT_TYPES = [
    "Rainfall",
    "Thunderstorm",
    "Flooding",
    "Heatwave",
    "Fog",
    "Dust Storm",
    "Strong Winds",
]


TRUST_LEVELS = [
    "High",
    "Medium",
    "Low",
]


ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
]


DATA_SOURCES = [
    {
        "name": "JSON Development Fixture",
        "mode": "development_fixture",
        "type": "development_fixture",
        "enabled": True,
    },
    {
        "name": "India Meteorological Department",
        "mode": "imd",
        "type": "official_api",
        "enabled": True,
    },
]