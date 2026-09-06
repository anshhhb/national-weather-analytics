from backend.config import DATA_FILE

from .imd_weather_source import IMDWeatherDataSource
from .json_weather_source import JsonWeatherDataSource


SOURCE_ADAPTERS = {
    "development_fixture": {
        "adapter": JsonWeatherDataSource(DATA_FILE),
        "name": "JSON Development Fixture",
        "type": "development_fixture",
    },
    "imd": {
        "adapter": IMDWeatherDataSource(),
        "name": "India Meteorological Department",
        "type": "official_api",
    },
}