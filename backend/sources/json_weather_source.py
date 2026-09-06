import json
from pathlib import Path

from .weather_source import WeatherDataSource


class JsonWeatherDataSource(WeatherDataSource):

    def __init__(self, file_path: Path):
        self.file_path = file_path

    def fetch(self):
        with self.file_path.open("r", encoding="utf-8") as file:
            return json.load(file)

    def validate(self, data):
        return isinstance(data, list)

    def normalize(self, data):
        return data

    def health_check(self):
        return self.file_path.exists()

    def get_metadata(self):
        return {
            "name": "JSON Weather Source",
            "type": "development_fixture",
            "mode": "development",
            "configured": True
        }