import json
import ssl
import urllib.parse
import urllib.request

import truststore

from .weather_source import WeatherDataSource


DEFAULT_IMD_URL = (
    "https://wis2box.imd.gov.in/oapi/collections/"
    "urn%3Awmo%3Amd%3Ain-imd%3Asurface-based-observations.synop/"
    "items"
)


class IMDWeatherDataSource(WeatherDataSource):

    def __init__(self, api_base_url: str = ""):
        self.api_base_url = api_base_url.strip() or DEFAULT_IMD_URL

    def fetch(self):
        params = urllib.parse.urlencode({
            "f": "json",
            "limit": "100",
        })

        url = f"{self.api_base_url}?{params}"

        request = urllib.request.Request(
            url,
            headers={
                "Accept": "application/geo+json, application/json",
                "User-Agent": "National-Weather-Analytics-Platform/1.0",
            },
        )

        ssl_context = truststore.SSLContext(
            ssl.PROTOCOL_TLS_CLIENT
        )

        try:
            with urllib.request.urlopen(
                request,
                timeout=30,
                context=ssl_context,
            ) as response:
                return json.load(response)

        except Exception as exc:
            raise RuntimeError("SOURCE_UNAVAILABLE") from exc

    def validate(self, data):
        return (
            isinstance(data, dict)
            and data.get("type") == "FeatureCollection"
            and isinstance(data.get("features"), list)
        )

    def normalize(self, data):
        normalized = []

        for feature in data.get("features", []):
            properties = feature.get("properties") or {}
            geometry = feature.get("geometry") or {}

            coordinates = geometry.get("coordinates") or []

            longitude = None
            latitude = None

            if len(coordinates) >= 2:
                longitude = coordinates[0]
                latitude = coordinates[1]

            observation_type = properties.get("name")

            normalized.append({
                "id": feature.get("id"),
                "text": (
                    properties.get("description")
                    or observation_type
                    or "IMD weather observation"
                ),
                "timestamp": (
                    properties.get("phenomenonTime")
                    or properties.get("reportTime")
                    or ""
                ),
                "source": "India Meteorological Department",
                "event_type": "Weather Observation",
                "trust_score": "Unknown",
                "latitude": latitude,
                "longitude": longitude,
                "state": None,
                "has_photo": False,

                "station_id": properties.get(
                    "wigos_station_identifier"
                ),
                "observation_type": observation_type,
                "value": properties.get("value"),
                "unit": properties.get("units"),
            })

        return normalized

    def health_check(self):
        return bool(self.api_base_url)

    def get_metadata(self):
        return {
            "name": "India Meteorological Department WIS2",
            "type": "official_api",
            "mode": "production",
            "configured": bool(self.api_base_url),
        }