from backend.sources.registry import SOURCE_ADAPTERS
from backend.config import SOURCE_MODE


class WeatherService:
    def __init__(self):
        self.source = SOURCE_ADAPTERS[SOURCE_MODE]["adapter"]

    def get_reports(self):
        try:
            reports = self.source.fetch()
        except Exception as exc:
            raise RuntimeError("SOURCE_UNAVAILABLE") from exc

        if not self.source.validate(reports):
            raise RuntimeError("PROCESSING_ERROR")

        return self.source.normalize(reports)


weather_service = WeatherService()